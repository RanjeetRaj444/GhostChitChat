import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const deleteFromCloudinary = async (url) => {
  if (!url) return;

  try {
    // Extract public ID from URL
    // Format: https://res.cloudinary.com/cloud_name/resource_type/upload/v1234567890/folder/filename.ext
    // We need: folder/filename

    // Split by 'upload/' and take the second part
    const parts = url.split(/\/upload\/(?:v\d+\/)?/);
    if (parts.length < 2) return;

    const publicIdWithExt = parts[1];
    // Remove file extension
    const publicId = publicIdWithExt.split(".").slice(0, -1).join(".");

    // Determine info from URL if possible, or try to delete as image/video/raw
    // Cloudinary destroy method needs resource_type if it's not 'image'

    let resourceType = "image";
    if (url.includes("/video/")) resourceType = "video";
    else if (url.includes("/raw/")) resourceType = "raw";

    console.log(`Deleting from Cloudinary: ${publicId} (${resourceType})`);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    console.log("Cloudinary deletion result:", result);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
  }
};

export default cloudinary;
