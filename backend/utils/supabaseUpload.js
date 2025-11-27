const supabase = require("../config/supabase");
const path = require("path");

/**
 * Upload image to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} originalName - Original filename
 * @param {string} folder - Folder in bucket (e.g., 'products', 'settings')
 * @returns {Promise<string>} - Public URL of uploaded file
 */
const uploadToSupabase = async (
  fileBuffer,
  originalName,
  folder = "products"
) => {
  try {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(originalName);
    const filename = `${folder}-${uniqueSuffix}${ext}`;
    const filePath = `${folder}/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("products")
      .upload(filePath, fileBuffer, {
        contentType: `image/${ext.slice(1)}`,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("products")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Upload to Supabase error:", error);
    throw error;
  }
};

/**
 * Delete image from Supabase Storage
 * @param {string} imageUrl - Full public URL of the image
 * @returns {Promise<boolean>} - Success status
 */
const deleteFromSupabase = async (imageUrl) => {
  try {
    if (!imageUrl) return true;

    // Extract file path from URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/products/products/filename.jpg
    const urlParts = imageUrl.split("/products/");
    if (urlParts.length < 2) {
      console.warn("Invalid Supabase URL format:", imageUrl);
      return false;
    }

    const filePath = urlParts[1];

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from("products")
      .remove([filePath]);

    if (error) {
      console.error("Supabase delete error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete from Supabase error:", error);
    return false;
  }
};

module.exports = {
  uploadToSupabase,
  deleteFromSupabase,
};
