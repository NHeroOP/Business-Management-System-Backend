import { uploadOnCloudinary } from "@/shared/config/cloudinary.js";
import { Product, type IProduct, type IProductDocument } from "./Product.model.js";

import { ApiError } from "@/shared/utils/ApiError.js";
import { Types, type AggregatePaginateResult } from "mongoose";

export interface CreateProductPayload extends Omit<
  IProduct,
  "metadata" | "isArchived" | "image"
> {
  imageUrl?: string;
}

interface FindProductsPayload {
  businessId: Types.ObjectId | string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}

interface ArchiveProductPayload {
  businessId: Types.ObjectId | string;
  productId: Types.ObjectId | string;
}

interface UpdateProductPayload {
  productId: Types.ObjectId | string;
  updateData: Partial<Omit<IProduct, "businessId" | "createdBy" | "isArchived" | "image" | "metadata">>;
}


export const createProduct = async (
  payload: CreateProductPayload
): Promise<IProductDocument> => {
  const {
    businessId,
    createdBy,
    name,
    price,
    type,
    description,
    stockQuantity,
    sku,
    category,
    imageUrl,
  } = payload;

  if (!name || !price || !type || !stockQuantity) {
    throw new ApiError(
      400,
      "Name, price, type, and stock quantity are required",
    );
  }

  if (!imageUrl) {
    throw new ApiError(400, "Product image is required");
  }

  if (sku) {
    const existingProductWithSku = await Product.findOne({ sku });
    if (existingProductWithSku) {
      throw new ApiError(400, "A product with the same SKU already exists");
    }
  }

  const uploadedImage = await uploadOnCloudinary(imageUrl);

  if (!uploadedImage) {
    throw new ApiError(500, "Failed to upload product image");
  }

  const image = {
    url: uploadedImage.secure_url,
    publicId: uploadedImage.public_id,
  };

  const newProduct = await Product.create({
    businessId,
    createdBy,
    name,
    price,
    type,
    stockQuantity,
    image,
    ...(description && { description }),
    ...(sku && { sku }),
    ...(category && { category }),
  });

  if (!newProduct) {
    throw new ApiError(500, "Failed to create product");
  }

  return newProduct;
};

export const findProducts = async (
  payload: FindProductsPayload
): Promise<AggregatePaginateResult<IProductDocument>> => {
  const { businessId, page = 1, limit = 10, search, sortBy } = payload;
  
  const productAggregate = Product.aggregate([
    {
      $match: { businessId: new Types.ObjectId(businessId), isArchived: false }
    }, {
      $sort: sortBy === "name" ? { name: 1 } : { createdAt: -1 }
    }, {
      $match: search ? { name: { $regex: search, $options: "i" } } : {}
    }, {
      $project: {
        metadata: 0
      }
    }
  ])

  const products = await Product.aggregatePaginate(productAggregate, { page, limit })

  if (!products || products.docs.length === 0) {
    throw new ApiError(404, "No products found for this business");
  }

  return products;
};

export const findProductById = async (
  productId: Types.ObjectId | string
): Promise<IProductDocument> => {
  const product = await Product.findById(productId).select("-metadata");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

export const updateProduct = async (
  payload: UpdateProductPayload
): Promise<void> => {
  const { productId, updateData } = payload;

  const product = await Product.findOne({
    _id: productId,
    isArchived: false,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  Object.assign(product, updateData);
  await product.save();
};

export const archiveProduct = async (
  { businessId, productId }: ArchiveProductPayload
): Promise<void> => { 
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const product = await Product.findOne({
    _id: productId,
    businessId: businessId,
    isArchived: false,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  product.isArchived = true;
  await product.save();
};
