/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import Vendor from "@/lib/models/vendor.model";
import { VendorUpdateData } from "@/lib/actions/admin/vendor.actions";
import { CacheService } from "./cache.service";
import { sendOrderConfirmationEmail } from "@/lib/workflows/email";

export class VendorService {
  private static readonly CACHE_PREFIX = "vendor:";
  private static readonly CACHE_TTL = 300; // 5 minutes

  private static getCacheKey(id: string) {
    return `${this.CACHE_PREFIX}${id}`;
  }

  private static sanitizeVendor(vendor: any): VendorResponse {
    const { ...safeVendor } = vendor;
    return {
      ...safeVendor,
      _id: safeVendor._id.toString(),
    };
  }

  static async createVendor(
    data: VendorUpdateData & { password: string; isVerified?: boolean }
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
}

export const sendOrderEmails = async (orderData: OrderEmailData) => {
  try {
    // Send to user
    await sendOrderConfirmationEmail({
      ...orderData,
      recipientType: "user",
    });

    // Send to admin
    await sendOrderConfirmationEmail({
      ...orderData,
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
