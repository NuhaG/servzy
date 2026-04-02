import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET_KEY,
});

export const uploadToCloudinary = async (fileBuffer, folder = "servzy") => {
  try {
    if (!fileBuffer) return null;

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        )
        .end(fileBuffer);
    });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return null;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  } catch (error) {
    console.error("Cloudinary delete failed:", error);
    return null;
  }
};
