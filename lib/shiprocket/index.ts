/**
 * Shiprocket Types Only
 * 
 * This module now only exports types for compatibility.
 * All Shiprocket functionality has been moved to the backend.
 * Use the ShiprocketService from @/services/shiprocket.service for API calls.
 */

// Export types only
export * from './types';

// Legacy exports for compatibility - these now throw errors
export const getShiprocketSDK = () => {
  throw new Error('getShiprocketSDK is deprecated. Use ShiprocketService.getInstance() instead.');
};

export const resetShiprocketSDK = () => {
  throw new Error('resetShiprocketSDK is deprecated. Shiprocket SDK has been moved to backend.');
};

export class ShiprocketSDK {
  constructor() {
    throw new Error('ShiprocketSDK is deprecated. Use ShiprocketService.getInstance() instead.');
  }
}