/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import Vendor from "@/lib/models/vendor.model";
import { VendorUpdateData } from "@/lib/actions/admin/vendor.actions";
import { CacheService } from "./cache.service";

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
}
