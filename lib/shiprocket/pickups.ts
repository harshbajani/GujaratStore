/* eslint-disable @typescript-eslint/no-explicit-any */
import { SHIPROCKET_CONFIG } from "./config";
import { ShiprocketHttpClient } from "./http-client";
import { ShiprocketAuth } from "./auth";
import {
  ShiprocketPickupLocationRequest,
  ShiprocketPickupLocationResponse,
  ShiprocketAPIResponse,
} from "./types";

/**
 * Shiprocket Pickup Locations Module
 * Handles pickup location management and vendor integration
 */
export class ShiprocketPickups {
  private httpClient: ShiprocketHttpClient;
  private auth: ShiprocketAuth;

  constructor(httpClient?: ShiprocketHttpClient, auth?: ShiprocketAuth) {
    this.httpClient = httpClient || new ShiprocketHttpClient();
    this.auth = auth || new ShiprocketAuth(this.httpClient);
  }

  /**
   * Get all pickup locations from Shiprocket
   */
  async getAllPickupLocations(): Promise<ShiprocketAPIResponse<any>> {
    try {
      console.log("[Shiprocket Pickups] Fetching all pickup locations");

      const token = await this.auth.getToken();
      if (!token) {
        return {
          success: false,
          error: {
            message: "Authentication failed",
            status: 401,
            statusText: "Unauthorized",
          },
        };
      }

      const response = await this.httpClient.get(
        SHIPROCKET_CONFIG.ENDPOINTS.GET_PICKUP_LOCATIONS,
        token
      );

      if (response.success) {
        console.log(
          "[Shiprocket Pickups] Successfully fetched pickup locations"
        );
      } else {
        console.error(
          "[Shiprocket Pickups] Failed to fetch pickup locations",
          response.error
        );
      }

      return response;
    } catch (error) {
      console.error(
        "[Shiprocket Pickups] Error fetching pickup locations:",
        error
      );

      return {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch pickup locations",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  /**
   * Add a new pickup location to Shiprocket
   */
  async addPickupLocation(
    locationData: ShiprocketPickupLocationRequest
  ): Promise<ShiprocketAPIResponse<ShiprocketPickupLocationResponse>> {
    try {
      console.log(
        `[Shiprocket Pickups] Adding pickup location: ${locationData.pickup_location}`
      );

      const token = await this.auth.getToken();
      if (!token) {
        return {
          success: false,
          error: {
            message: "Authentication failed",
            status: 401,
            statusText: "Unauthorized",
          },
        };
      }

      const response =
        await this.httpClient.post<ShiprocketPickupLocationResponse>(
          SHIPROCKET_CONFIG.ENDPOINTS.ADD_PICKUP_LOCATION,
          locationData,
          token
        );

      if (response.success) {
        console.log(
          `[Shiprocket Pickups] Successfully added pickup location: ${locationData.pickup_location}`
        );
      } else {
        console.error(
          `[Shiprocket Pickups] Failed to add pickup location: ${locationData.pickup_location}`,
          response.error
        );
      }

      return response;
    } catch (error) {
      console.error(
        "[Shiprocket Pickups] Error adding pickup location:",
        error
      );

      return {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to add pickup location",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  /**
   * Create pickup location for a vendor from vendor data
   */
  async createVendorPickupLocation(
    vendor: any
  ): Promise<{ success: boolean; location_name?: string; error?: string }> {
    try {
      if (!vendor.store?.addresses) {
        return {
          success: false,
          error: "Vendor address not found",
        };
      }

      const address = vendor.store.addresses;
      const locationName = this.generateLocationName(vendor);

      const pickupLocationData: ShiprocketPickupLocationRequest = {
        pickup_location: locationName,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.store.contact,
        address: address.address_line_1,
        address_2: address.address_line_2 || "",
        city: address.locality,
        state: address.state,
        country: "India",
        pin_code: address.pincode,
      };

      console.log(
        `[Shiprocket Pickups] Creating pickup location for vendor: ${vendor.name}`
      );
      const response = await this.addPickupLocation(pickupLocationData);

      if (response.success) {
        return {
          success: true,
          location_name: locationName,
        };
      } else {
        // Check if the error is about existing inactive address
        const errorMessage = response.error?.message || response.error?.response || "";
        if (typeof errorMessage === 'string' && 
            (errorMessage.includes("Address name already exists and is inactive") ||
             errorMessage.includes("already exists and is inactive"))) {
          console.log(
            `[Shiprocket Pickups] Pickup location ${locationName} already exists but is inactive. Using existing location.`
          );
          return {
            success: true,
            location_name: locationName,
          };
        }
        
        return {
          success: false,
          error: response.error?.message || "Failed to create pickup location",
        };
      }
    } catch (error) {
      console.error(
        "[Shiprocket Pickups] Error creating vendor pickup location:",
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate standardized pickup location name for vendor
   * Ensures name is under 36 character limit required by Shiprocket
   */
  generateLocationName(vendor: any): string {
    const storeName = vendor.store?.storeName || "Store";
    const vendorId = vendor._id || "unknown";

    // Create base name
    let baseName = `${storeName}_${vendorId}`.replace(/[^a-zA-Z0-9_]/g, "_");

    // Enforce 36 character limit (Shiprocket requirement)
    if (baseName.length > 36) {
      // Keep first part of store name + last 8 chars of vendor ID
      const vendorIdSuffix = vendorId.slice(-8);
      const maxStoreNameLength = 36 - vendorIdSuffix.length - 1; // -1 for underscore
      const truncatedStoreName = storeName.slice(0, maxStoreNameLength);
      baseName = `${truncatedStoreName}_${vendorIdSuffix}`.replace(
        /[^a-zA-Z0-9_]/g,
        "_"
      );

      // Final safety check
      if (baseName.length > 36) {
        baseName = baseName.slice(0, 36);
      }
    }

    return baseName;
  }

  /**
   * Get pickup location name for vendor (checks if already exists)
   */
  getVendorPickupLocation(vendor: any): string {
    return (
      vendor.shiprocket_pickup_location || this.generateLocationName(vendor)
    );
  }

  /**
   * Check if vendor has valid pickup location setup
   */
  hasValidPickupLocation(vendor: any): boolean {
    return !!(
      vendor.shiprocket_pickup_location &&
      vendor.shiprocket_pickup_location_added
    );
  }
}
