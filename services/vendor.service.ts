/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import Vendor from "@/lib/models/vendor.model";
import { VendorUpdateData } from "@/lib/actions/admin/vendor.actions";
import { CacheService } from "./cache.service";
import { sendOrderConfirmationEmail } from "@/lib/workflows/emails";

export class VendorService {
  private static readonly CACHE_PREFIX = "vendor:";
  private static readonly CACHE_TTL = 86400; // 24 hours

  private static getCacheKey(id: string) {
    return `${this.CACHE_PREFIX}${id}`;
  }

  private static sanitizeVendor(vendor: any): VendorResponse {
    const sanitized = JSON.parse(JSON.stringify(vendor));

    // Convert main _id
    if (sanitized._id) {
      sanitized._id = sanitized._id.toString();
    }

    // Convert nested object IDs
    if (sanitized.store && sanitized.store._id) {
      sanitized.store._id = sanitized.store._id.toString();
    }

    if (sanitized.documents && sanitized.documents._id) {
      sanitized.documents._id = sanitized.documents._id.toString();
    }

    if (sanitized.personalInfo && sanitized.personalInfo._id) {
      sanitized.personalInfo._id = sanitized.personalInfo._id.toString();
    }

    // Handle any other nested objects that might have _id fields
    const convertNestedIds = (obj: any) => {
      if (obj && typeof obj === "object") {
        if (obj._id && typeof obj._id === "object") {
          obj._id = obj._id.toString();
        }
        for (const key in obj) {
          if (
            obj.hasOwnProperty(key) &&
            typeof obj[key] === "object" &&
            obj[key] !== null
          ) {
            convertNestedIds(obj[key]);
          }
        }
      }
    };

    convertNestedIds(sanitized);

    return sanitized;
  }

  static async createVendor(
    data: VendorUpdateData & {
      password: string;
      isVerified?: boolean;
      emailVerified?: boolean;
    }
  ): Promise<ActionResponse<VendorResponse>> {
    try {
      await connectToDB();

      const existing = await Vendor.findOne({ email: data.email });
      if (existing) {
        return {
          success: false,
          message: "Vendor already exists",
        };
      }

      const vendor = await Vendor.create({
        ...data,
        isVerified: data.isVerified ?? false,
        emailVerified: data.emailVerified ?? false,
      });

      const sanitizedVendor = this.sanitizeVendor(vendor.toObject());
      await CacheService.set(
        this.getCacheKey(sanitizedVendor._id),
        sanitizedVendor,
        this.CACHE_TTL
      );

      // Invalidate paginated cache
      await this.invalidatePaginatedCache();

      return {
        success: true,
        message: "Vendor created successfully",
        data: sanitizedVendor,
      };
    } catch (error) {
      console.error("Create vendor error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create vendor",
      };
    }
  }

  // NEW: Paginated vendors with server-side filtering and sorting
  static async getAllVendorsPaginated(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<VendorResponse>> {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "name",
        sortOrder = "asc",
      } = params;

      // Create cache key based on all parameters
      const cacheKey = `${this.CACHE_PREFIX}paginated:${page}:${limit}:${search}:${sortBy}:${sortOrder}`;

      const cached = await CacheService.get<PaginatedResponse<VendorResponse>>(
        cacheKey
      );
      if (cached) {
        return cached;
      }

      await connectToDB();

      // Build query for search
      const query: any = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { "store.storeName": { $regex: search, $options: "i" } },
          { "store.contact": { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      if (sortBy === "storeName") {
        sort["store.storeName"] = sortOrder === "desc" ? -1 : 1;
      } else {
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [vendors, totalCount] = await Promise.all([
        Vendor.find(query).sort(sort).skip(skip).limit(limit).lean(),
        Vendor.countDocuments(query),
      ]);

      const sanitizedVendors = vendors.map(this.sanitizeVendor);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<VendorResponse> = {
        success: true,
        data: sanitizedVendors,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNext,
          hasPrev,
        },
      };

      // Cache the result
      await CacheService.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      console.error("Get vendors paginated error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch vendors",
      };
    }
  }

  // LEGACY: Keep existing method for backward compatibility
  static async getAllVendors(): Promise<ActionResponse<VendorResponse[]>> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}all`;
      const cachedData = await CacheService.get<VendorResponse[]>(cacheKey);

      if (cachedData) {
        return {
          success: true,
          message: "Vendors retrieved from cache",
          data: cachedData,
        };
      }

      await connectToDB();
      const vendors = await Vendor.find({}).lean();
      const sanitizedVendors = vendors.map(this.sanitizeVendor);

      await CacheService.set(cacheKey, sanitizedVendors, this.CACHE_TTL);

      return {
        success: true,
        message: "Vendors retrieved successfully",
        data: sanitizedVendors,
      };
    } catch (error) {
      console.error("Get vendors error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch vendors",
      };
    }
  }

  static async getVendorById(
    id: string
  ): Promise<ActionResponse<VendorResponse>> {
    try {
      const cacheKey = this.getCacheKey(id);
      const cachedData = await CacheService.get<VendorResponse>(cacheKey);

      if (cachedData) {
        return {
          success: true,
          message: "Vendor retrieved from cache",
          data: cachedData,
        };
      }

      await connectToDB();
      const vendor = await Vendor.findById(id).lean();

      if (!vendor) {
        return {
          success: false,
          message: "Vendor not found",
        };
      }

      const sanitizedVendor = this.sanitizeVendor(vendor);
      await CacheService.set(cacheKey, sanitizedVendor, this.CACHE_TTL);

      return {
        success: true,
        message: "Vendor retrieved successfully",
        data: sanitizedVendor,
      };
    } catch (error) {
      console.error("Get vendor error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch vendor",
      };
    }
  }

  static async getVendorByEmail(
    email: string
  ): Promise<ActionResponse<VendorResponse>> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}email:${email}`;
      const cachedData = await CacheService.get<VendorResponse>(cacheKey);

      if (cachedData) {
        return {
          success: true,
          message: "Vendor retrieved from cache",
          data: cachedData,
        };
      }

      await connectToDB();
      const vendor = await Vendor.findOne({ email }).lean();

      if (!vendor) {
        return {
          success: false,
          message: "Vendor not found",
        };
      }

      const sanitizedVendor = this.sanitizeVendor(vendor);
      await CacheService.set(cacheKey, sanitizedVendor, this.CACHE_TTL);

      return {
        success: true,
        message: "Vendor retrieved successfully",
        data: sanitizedVendor,
      };
    } catch (error) {
      console.error("Get vendor error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch vendor",
      };
    }
  }

  static async updateVendor(
    id: string,
    data: VendorUpdateData,
    email?: string
  ): Promise<ActionResponse<VendorResponse>> {
    try {
      await connectToDB();

      if (data.email) {
        const existingVendor = await Vendor.findOne({
          email: data.email,
          _id: { $ne: id },
        });

        if (existingVendor) {
          return {
            success: false,
            message: "Email already in use",
          };
        }
      }

      if (data.phone) {
        const existingVendor = await Vendor.findOne({
          phone: data.phone,
          _id: { $ne: id },
        });

        if (existingVendor) {
          return {
            success: false,
            message: "Phone number already in use",
          };
        }
      }

      const query = email ? { email } : { _id: id };
      const updatedVendor = await Vendor.findOneAndUpdate(
        query,
        { $set: data },
        { new: true }
      ).lean();

      if (!updatedVendor) {
        return {
          success: false,
          message: "Vendor not found",
        };
      }

      const sanitizedVendor = this.sanitizeVendor(updatedVendor);

      // Update cache
      await CacheService.set(
        this.getCacheKey(id),
        sanitizedVendor,
        this.CACHE_TTL
      );
      await CacheService.delete(`${this.CACHE_PREFIX}all`);
      if (email) {
        await CacheService.delete(`${this.CACHE_PREFIX}email:${email}`);
      }

      // Invalidate paginated cache
      await this.invalidatePaginatedCache();

      return {
        success: true,
        message: "Vendor updated successfully",
        data: sanitizedVendor,
      };
    } catch (error) {
      console.error("Update vendor error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update vendor",
      };
    }
  }

  static async deleteVendor(id: string): Promise<ActionResponse<void>> {
    try {
      await connectToDB();

      const vendor = await Vendor.findByIdAndDelete(id);

      if (!vendor) {
        return {
          success: false,
          message: "Vendor not found",
        };
      }

      // Clear cache
      await CacheService.delete(this.getCacheKey(id));
      await CacheService.delete(`${this.CACHE_PREFIX}all`);
      await CacheService.delete(`${this.CACHE_PREFIX}email:${vendor.email}`);

      // Invalidate paginated cache
      await this.invalidatePaginatedCache();

      return {
        success: true,
        message: "Vendor deleted successfully",
      };
    } catch (error) {
      console.error("Delete vendor error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete vendor",
      };
    }
  }

  // Helper method to invalidate all paginated cache keys
  private static async invalidatePaginatedCache(): Promise<void> {
    try {
      const keys = await CacheService.keys(`${this.CACHE_PREFIX}paginated:*`);
      await Promise.all(keys.map((key) => CacheService.delete(key)));
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }

  /**
   * Update pickup location for vendor in Shiprocket (forces update)
   */
  static async updateVendorPickupLocation(
    vendorId: string
  ): Promise<ActionResponse<{ location_name: string }>> {
    try {
      const vendorResponse = await this.getVendorById(vendorId);
      if (!vendorResponse.success || !vendorResponse.data) {
        return {
          success: false,
          message: "Vendor not found",
        };
      }

      const vendor = vendorResponse.data;
      const oldLocationName = vendor.shiprocket_pickup_location;
      console.log(`[VendorService] Force updating pickup location for vendor: ${vendor.name}`);
      console.log(`[VendorService] Old pickup location: ${oldLocationName}`);

      // Import ShiprocketService dynamically to avoid circular dependency
      const { ShiprocketService } = await import("./shiprocket.service");
      const shiprocketService = ShiprocketService.getInstance();

      // Use fresh vendor data (with updated store information) to update pickup location
      const result = await shiprocketService.updateVendorPickupLocation(vendor, oldLocationName);

      if (result.success && result.location_name) {
        // Update vendor with new pickup location info
        await this.updateVendor(vendorId, {
          shiprocket_pickup_location: result.location_name,
          shiprocket_pickup_location_added: true,
        });

        return {
          success: true,
          message: "Pickup location updated successfully",
          data: { location_name: result.location_name },
        };
      } else {
        return {
          success: false,
          message: result.error || "Failed to update pickup location",
        };
      }
    } catch (error) {
      console.error("Update vendor pickup location error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update pickup location",
      };
    }
  }

  /**
   * Create pickup location for vendor in Shiprocket
   */
  static async createVendorPickupLocation(
    vendorId: string
  ): Promise<ActionResponse<{ location_name: string }>> {
    try {
      const vendorResponse = await this.getVendorById(vendorId);
      if (!vendorResponse.success || !vendorResponse.data) {
        return {
          success: false,
          message: "Vendor not found",
        };
      }

      const vendor = vendorResponse.data;

      if (vendor.shiprocket_pickup_location_added && vendor.shiprocket_pickup_location) {
        // Verify the pickup location actually exists in Shiprocket
        const { ShiprocketService } = await import("./shiprocket.service");
        const shiprocketServiceVerify = ShiprocketService.getInstance();
        try {
          const locations = await shiprocketServiceVerify.getPickupLocations();
          const all = Array.isArray(locations) ? locations : (locations?.data?.shipping_address || locations?.shipping_address || []);
          const exists = (all || []).some((a: any) => {
            const name = a?.pickup_location || a?.warehouse_code || a?.tag_value || a?.tag;
            return name && name.toString() === vendor.shiprocket_pickup_location;
          });
          if (exists) {
            return {
              success: true,
              message: "Pickup location already exists",
              data: { location_name: vendor.shiprocket_pickup_location! },
            };
          }
          // If flag true but not found in Shiprocket, fall through to create it
          console.warn("Vendor has pickup flag but location not found in Shiprocket. Recreating...", vendor.shiprocket_pickup_location);
        } catch (e) {
          console.warn("Failed to verify pickup locations; attempting create anyway", e);
        }
      }

      // Import ShiprocketService dynamically to avoid circular dependency
      const { ShiprocketService } = await import("./shiprocket.service");
      const shiprocketService = ShiprocketService.getInstance();

      const result = await shiprocketService.createVendorPickupLocation(vendor);

      if (result.success && result.location_name) {
        // Update vendor with pickup location info
        await this.updateVendor(vendorId, {
          shiprocket_pickup_location: result.location_name,
          shiprocket_pickup_location_added: true,
        });

        return {
          success: true,
          message: "Pickup location created successfully",
          data: { location_name: result.location_name },
        };
      } else {
        return {
          success: false,
          message: result.error || "Failed to create pickup location",
        };
      }
    } catch (error) {
      console.error("Create vendor pickup location error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create pickup location",
      };
    }
  }

  /**
   * Sync pickup locations for all verified vendors
   */
  static async syncAllVendorPickupLocations(): Promise<
    ActionResponse<{ synced: number; errors: string[] }>
  > {
    try {
      await connectToDB();

      // Get all verified vendors without pickup locations
      const vendors = await Vendor.find({
        isVerified: true,
        shiprocket_pickup_location_added: { $ne: true },
      }).lean<IVendor[]>();

      const results = {
        synced: 0,
        errors: [] as string[],
      };

      for (const vendor of vendors) {
        try {
          const response = await this.createVendorPickupLocation(
            vendor._id.toString()
          );
          if (response.success) {
            results.synced++;
          } else {
            results.errors.push(`${vendor.name}: ${response.message}`);
          }
        } catch (error) {
          results.errors.push(
            `${vendor.name}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      return {
        success: true,
        message: `Synced ${results.synced} vendors, ${results.errors.length} errors`,
        data: results,
      };
    } catch (error) {
      console.error("Sync vendor pickup locations error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to sync pickup locations",
      };
    }
  }
}

export const sendOrderEmails = async (orderData: OrderEmailData) => {
  try {
    // Send to user
    await sendOrderConfirmationEmail({
      ...orderData,
      email: orderData.userEmail,
      orderDate: orderData.createdAt,
      recipientType: "user",
    });

    // Send to admin
    await sendOrderConfirmationEmail({
      ...orderData,
      email: process.env.ADMIN_USERNAME!,
      orderDate: orderData.createdAt,
      recipientType: "admin",
      userEmail: process.env.ADMIN_USERNAME!,
    });

    // Get unique vendor IDs from order items
    const vendorIds = [
      ...new Set(orderData.items.map((item) => item.vendorId)),
    ];

    // Send to each vendor
    for (const vendorId of vendorIds) {
      const vendorResponse = await VendorService.getVendorById(vendorId!);

      if (vendorResponse.success && vendorResponse.data) {
        // Filter items for this specific vendor
        const vendorItems = orderData.items.filter(
          (item) => item.vendorId === vendorId
        );

        await sendOrderConfirmationEmail({
          ...orderData,
          email: vendorResponse.data.email,
          orderDate: orderData.createdAt,
          items: vendorItems, // Only send vendor-specific items
          recipientType: "vendor",
          userEmail: vendorResponse.data.email,
          vendorId,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending order emails:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send order emails",
    };
  }
};
