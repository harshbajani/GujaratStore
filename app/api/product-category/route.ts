import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Products from "@/lib/models/product.model";
import { Types } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;

    // Get pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    
    // Get filtering parameters
    const categoryId = searchParams.get("categoryId");
    const secondaryCategories = searchParams.get("secondaryCategories")?.split(",").filter(Boolean);
    const colors = searchParams.get("colors")?.split(",").filter(Boolean);
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;

    if (!categoryId) {
      return NextResponse.json({
        success: false,
        error: "Category ID is required"
      }, { status: 400 });
    }

    if (!Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json({
        success: false,
        error: "Invalid category ID"
      }, { status: 400 });
    }

    // Build query
    const query: any = {
      productStatus: true, // Only active products
      primaryCategory: new Types.ObjectId(categoryId), // Filter by primary category
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: "i" } },
        { productDescription: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    // Add secondary category filter
    if (secondaryCategories && secondaryCategories.length > 0) {
      query["secondaryCategory"] = { $in: secondaryCategories.map(id => new Types.ObjectId(id)) };
    }

    // Add color filter
    if (colors && colors.length > 0) {
      query.productColor = { $in: colors.map(color => new RegExp(`^${color}$`, 'i')) };
    }

    // Add price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.netPrice = {};
      if (minPrice !== undefined) query.netPrice.$gte = minPrice;
      if (maxPrice !== undefined) query.netPrice.$lte = maxPrice;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [products, totalCount] = await Promise.all([
      Products.find(query)
        .populate([
          { path: "parentCategory", select: "name" },
          { path: "primaryCategory", select: "name" },
          { path: "secondaryCategory", select: "name" },
          { path: "brands", select: "name" },
          { path: "attributes.attributeId", select: "name" },
          { path: "productSize", select: "label" },
          { path: "productReviews", select: "rating" },
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Products.countDocuments(query),
    ]);

    // Transform products to match the expected format
    const transformedProducts = products.map((product: any) => ({
      ...product,
      _id: product._id.toString(),
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const result: PaginatedResponse<IProductResponse> = {
      success: true,
      data: transformedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNext,
        hasPrev,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET product-category:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    );
  }
}
