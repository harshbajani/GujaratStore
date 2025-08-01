import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export function withAdminAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // Get the admin auth token from cookies
      const adminAuthToken = request.cookies.get('admin_auth_token')?.value;
      
      if (!adminAuthToken) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Admin authentication required' },
          { status: 401 }
        );
      }

      // Verify the JWT token
      const jwtSecret = process.env.JWT_SECRET || 'gujarat_store_admin_secret_key_2025_secure';
      
      try {
        const decoded = jwt.verify(adminAuthToken, jwtSecret) as any;
        
        // Check if the role is admin
        if (decoded.role !== 'admin') {
          return NextResponse.json(
            { success: false, error: 'Forbidden - Admin role required' },
            { status: 403 }
          );
        }
        
        // Add admin info to request for downstream use
        (request as any).admin = decoded;
        
      } catch (jwtError) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired admin token' },
          { status: 401 }
        );
      }

      // Call the original handler
      return handler(request, ...args);
      
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}
