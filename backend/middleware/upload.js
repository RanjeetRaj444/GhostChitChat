import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine the resource type and folder based on file mimetype
    let resourceType = "auto";
    let folder = "uploads";

    if (file.mimetype.startsWith("image")) {
      resourceType = "image";
      folder = "chat/images";
    } else if (file.mimetype.startsWith("video")) {
      resourceType = "video";
      folder = "chat/videos";
    } else if (file.mimetype.startsWith("audio")) {
      resourceType = "video"; // Cloudinary treats audio as video for resource_type usually, or "auto" works. Let's use "auto" for audio to be safe.
      folder = "chat/audio";
      resourceType = "auto";
    } else {
      resourceType = "raw"; // For documents like PDF, DOC, etc.
      folder = "chat/files";
    }

    return {
      folder: folder,
      resource_type: resourceType,
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}-${path.parse(file.originalname).name}`,
      // Keep original extension for raw files if needed, but Cloudinary handles it.
      // format: ... (optional)
    };
  },
});

// File filter (kept from original)
const fileFilter = (req, file, cb) => {
  const allowedTypes =
    /jpeg|jpg|png|gif|webp|mp4|webm|mpeg|pdf|doc|docx|txt|mp3|wav|m4a/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only image, video, audio, and document files (pdf, doc, txt) are allowed!",
      ),
      false,
    );
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Increased to 50MB for videos
  },
  fileFilter: fileFilter,
});

export default upload;
