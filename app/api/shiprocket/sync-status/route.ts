/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Order from "@/lib/models/order.model";
import User from "@/lib/models/user.model";
// Removed direct SDK dependency - now uses backend proxy

// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 30; // Conservative limit for Shiprocket API
const INTER_REQUEST_DELAY = 100; // 100ms delay between individual requests
const BATCH_DELAY = 2000; // 2 second delay between batches

/**
 * POST endpoint for manual status sync (can be called by cron job services like Vercel Cron)
 * This endpoint syncs order statuses for all active shipments
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDB();

    const authorization = request.headers.get('authorization');

    // Simple API key validation for cron job security
    // You should set CRON_SECRET in your environment variables
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Starting Shiprocket status sync...");

    // Find all orders with active shipments that haven't been delivered yet
    // Include orders without AWB codes to enable early tracking and notifications
    const activeOrders = await Order.find({
      $or: [
        { "shipping.shiprocket_order_id": { $exists: true } },
        { "shipping.shiprocket_shipment_id": { $exists: true } }
      ],
      status: { $in: ["ready to ship", "shipped", "out for delivery"] },
    }).sort({ "shipping.last_update": 1 }); // Start with oldest updates first

    console.log(`Found ${activeOrders.length} active shipments to sync`);

    // For now, return basic results - the backend will handle actual sync
    const results = {
      total: activeOrders.length,
      updated: 0,
      errors: 0,
      notifications_sent: 0,
    };

    // TODO: Implement actual sync logic or proxy to backend
    console.log(`[Frontend Sync] Would sync ${activeOrders.length} orders`);
    
    // The actual sync logic has been moved to the backend
    // This endpoint can be removed or converted to proxy to backend

    console.log("Shiprocket status sync completed:", results);

    return NextResponse.json({
      success: true,
      message: "Status sync completed",
      results,
    });
  } catch (error) {
    console.error("Shiprocket sync error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Sync failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check sync status and get information
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDB();

    // Count active shipments
    const activeShipments = await Order.countDocuments({
      $or: [
        { "shipping.shiprocket_order_id": { $exists: true } },
        { "shipping.shiprocket_shipment_id": { $exists: true } }
      ],
      status: { $in: ["ready to ship", "shipped", "out for delivery"] },
    });

    // Get last sync information
    const lastSyncedOrder = await Order.findOne({
      "shipping.last_update": { $exists: true },
    }).sort({ "shipping.last_update": -1 });

    return NextResponse.json({
      success: true,
      active_shipments: activeShipments,
      last_sync: lastSyncedOrder?.shipping?.last_update || null,
      sync_endpoint: "/api/shiprocket/sync-status",
      webhook_endpoint: "/api/shiprocket/webhook",
    });
  } catch (error) {
    console.error("Sync status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Rate limiting helper function
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const key = 'shiprocket_api';
  
  let entry = rateLimitMap.get(key);
  
  // Clean up expired entries
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(key, entry);
  }
  
  // Check if we're at the limit
  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = entry.resetTime - now;
    console.log(`Rate limit reached, waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Reset after waiting
    entry = { count: 0, resetTime: now + waitTime + RATE_LIMIT_WINDOW };
    rateLimitMap.set(key, entry);
  }
  
  entry.count++;
}

// syncOrderStatus function has been moved to the backend
// This route now serves as a placeholder or can be removed

// Email notification function has been moved to individual tracking routes
// This function is no longer needed here
