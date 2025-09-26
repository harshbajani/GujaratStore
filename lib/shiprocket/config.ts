import { ShiprocketConfig } from './types';

/**
 * Shiprocket Configuration
 * Centralized configuration for Shiprocket API integration
 */
export const SHIPROCKET_CONFIG: ShiprocketConfig = {
  // API Configuration
  API_BASE_URL: process.env.SHIPROCKET_API_BASE_URL || 'https://apiv2.shiprocket.in/v1/external',
  STAGING_API_BASE_URL: 'https://staging-express.shiprocket.in/v1/external',
  
  // Authentication
  EMAIL: process.env.SHIPROCKET_EMAIL,
  PASSWORD: process.env.SHIPROCKET_PASSWORD,
  
  // Default values for testing
  DEFAULT_PICKUP_LOCATION: 'Primary', // This should match your pickup location name in Shiprocket
  DEFAULT_CHANNEL_ID: 'custom', // Custom channel for API orders
  
  // Order status mapping from Shiprocket to your system
  STATUS_MAPPING: {
    // Shiprocket statuses -> Your system statuses
    'NEW': 'ready to ship',
    'PICKUP_SCHEDULED': 'ready to ship',
    'PICKUP_GENERATED': 'ready to ship',
    'PICKED_UP': 'shipped',
    'IN_TRANSIT': 'shipped',
    'OUT_FOR_DELIVERY': 'out for delivery',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
    'LOST': 'cancelled',
    'DAMAGED': 'returned',
    'RETURNED': 'returned',
    'RTO_INITIATED': 'returned',
    'RTO_DELIVERED': 'returned',
  },
  
  // Reverse mapping for email notifications
  NOTIFICATION_MAPPING: {
    'PICKED_UP': 'shipped',
    'IN_TRANSIT': 'in_transit',
    'OUT_FOR_DELIVERY': 'out_for_delivery',
    'DELIVERED': 'delivered',
  },
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: '/auth/login',
    CREATE_ORDER: '/orders/create/adhoc',
    TRACK_ORDER: '/courier/track/awb',
    TRACK_BY_ORDER_ID: '/courier/track',
    CANCEL_ORDER: '/orders/cancel',
    GENERATE_PICKUP: '/courier/assign/pickup',
    GET_SERVICEABILITY: '/courier/serviceability',
    GET_COURIERS: '/courier/courierListWithCounts',
    ADD_PICKUP_LOCATION: '/settings/company/addpickup',
    GET_PICKUP_LOCATIONS: '/settings/company/pickup',
  },
  
  // Default dimensions and weight (in case not provided)
  DEFAULT_DIMENSIONS: {
    length: 10, // cm
    breadth: 10, // cm
    height: 10, // cm
    weight: 0.5, // kg
  },
};

/**
 * Validate Shiprocket configuration
 */
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!SHIPROCKET_CONFIG.EMAIL) {
    errors.push('SHIPROCKET_EMAIL is required');
  }

  if (!SHIPROCKET_CONFIG.PASSWORD) {
    errors.push('SHIPROCKET_PASSWORD is required');
  }

  if (!SHIPROCKET_CONFIG.API_BASE_URL) {
    errors.push('SHIPROCKET_API_BASE_URL is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get environment-specific API URL
 */
export function getApiBaseUrl(): string {
  return SHIPROCKET_CONFIG.API_BASE_URL;
}

/**
 * Check if running in staging mode
 */
export function isStaging(): boolean {
  return SHIPROCKET_CONFIG.API_BASE_URL === SHIPROCKET_CONFIG.STAGING_API_BASE_URL;
}
