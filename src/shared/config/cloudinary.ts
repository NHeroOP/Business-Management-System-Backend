import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!!, 
  api_key: process.env.CLOUDINARY_API_KEY!!, 
  api_secret: process.env.CLOUDINARY_API_SECRET!!
});

const getPublicId = (url: string | undefined) => {
  if (!url) return null

  const afterUpload = url.split("/upload/")[1];
  const parts = afterUpload!!.split("/");

  if (parts[0]!!.startsWith("v")) {
    parts.shift();
  }

  return parts.join("/").replace(/\.[^/.]+$/, "");
}

export const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null
    const uploadResult = await cloudinary.uploader
      .upload(
        localFilePath, {
          resource_type: "auto"
        }
    );
    fs.unlinkSync(localFilePath);
    return uploadResult;

  } catch (err) {
    fs.unlinkSync(localFilePath);
    return null;
  }
}


export const removeOnCloudinary = async (url: string | undefined) => {
  try {
    if (!url) return null
    const id = getPublicId(url);
    if (!id) return null

    await cloudinary.uploader.destroy(id)
  } catch (err) {
    return null
  }
}