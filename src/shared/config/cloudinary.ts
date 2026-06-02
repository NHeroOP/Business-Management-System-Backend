import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!!, 
  api_key: process.env.CLOUDINARY_API_KEY!!, 
  api_secret: process.env.CLOUDINARY_API_SECRET!!
});

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


export const removeOnCloudinary = async (publicId: string | undefined) => {
  try {
    if (!publicId) return null

    await cloudinary.uploader.destroy(publicId)
  } catch (err) {
    return null
  }
}