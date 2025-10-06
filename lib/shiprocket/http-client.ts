import { SHIPROCKET_CONFIG } from './config';
import { ShiprocketError, ShiprocketAPIResponse } from './types';

/**
 * Shiprocket HTTP Client
 * Handles all HTTP communication with Shiprocket API
 */
export class ShiprocketHttpClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || SHIPROCKET_CONFIG.API_BASE_URL;
  }

  /**
   * Make HTTP request to Shiprocket API
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<ShiprocketAPIResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const config: RequestInit = {
        ...options,
        headers,
      };

      console.log(`[Shiprocket] ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        const error: ShiprocketError = {
          message: `API Error: ${response.status} ${response.statusText}`,
          status: response.status,
          statusText: response.statusText,
          response: errorText,
        };

        console.error(`[Shiprocket] Error:`, error);
        
        return {
          success: false,
          error,
        };
      }

      const data = await response.json();
      console.log(`[Shiprocket] Success:`, { status: response.status, data: typeof data });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`[Shiprocket] Request failed:`, error);
      
      const shiprocketError: ShiprocketError = {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
        statusText: 'Network Error',
        response: error,
      };

      return {
        success: false,
        error: shiprocketError,
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, token?: string): Promise<ShiprocketAPIResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, token);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data: any,
    token?: string
  ): Promise<ShiprocketAPIResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data: any,
    token?: string
  ): Promise<ShiprocketAPIResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, token?: string): Promise<ShiprocketAPIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, token);
  }
}
