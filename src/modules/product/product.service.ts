import { removeOnCloudinary, uploadOnCloudinary } from "@/shared/config/cloudinary.js";
import { Product, type IProductDocument } from "./Product.model.js";

import { ApiError } from "@/shared/utils/ApiError.js";
import { Types, type AggregatePaginateResult } from "mongoose";
import type { CreateProductInput, FindProductsQuery, ProductIdParam, UpdateProductInput } from "./product.validation.js";

type CreateProductPayload = CreateProductInput & {
  businessId: Types.ObjectId;
  createdBy: Types.ObjectId;
  imageUrl?: string;
}

type FindProductsPayload = FindProductsQuery & {
  businessId: Types.ObjectId;
}

type ProductContext = ProductIdParam & {
  businessId: Types.ObjectId;
}

type UpdateProductPayload = UpdateProductInput & ProductContext;

type UpdateProductImagePayload = ProductContext & {
  imageUrl: string;
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
  const { businessId, page, limit, search, sortBy } = payload;
  
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
  { businessId, productId }: ProductContext
): Promise<IProductDocument> => {
  const product = await Product.findOne({
    _id: productId,
    businessId,
    isArchived: false,
  }).select("-metadata");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

export const updateProduct = async (
  payload: UpdateProductPayload
): Promise<void> => {
  const { businessId, productId, ...updateData } = payload;

  const product = await Product.findOneAndUpdate(
    {
      _id: productId,
      businessId: businessId,
      isArchived: false,
    },
    { ...updateData },
    { "returnDocument": "after" }
  );

  if (!product) {
    throw new ApiError(404, "Product not found");
  }
};

export const updateProductImage = async ({
  businessId,
  productId,
  imageUrl,
}: UpdateProductImagePayload): Promise<void> => {
  if (!productId || !imageUrl) {
    throw new ApiError(400, "Product ID, and Image URL are required");
  }

  const uploadedImage = await uploadOnCloudinary(imageUrl);
  const image = {
    url: uploadedImage?.secure_url,
    publicId: uploadedImage?.public_id,
  };

  const product = await Product.findOneAndUpdate(
    { _id: productId, businessId: businessId, isArchived: false },
    { image },
  ).select("-isArchived -metadata");
  
  await removeOnCloudinary(product?.image?.publicId);

  if (!product) {
    throw new ApiError(404, "Product not found or failed to update");
  }
};

export const archiveProduct = async (
  { businessId, productId }: ProductContext
): Promise<void> => { 
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const product = await Product.findOneAndUpdate({
    _id: productId,
    businessId: businessId,
    isArchived: false,
  }, {
    isArchived: true
  }, {
    "returnDocument": "after"
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }
};
