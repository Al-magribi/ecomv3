import sharp from "sharp";

/**
 * Compresses an image buffer using sharp.
 * @param {Buffer} buffer - The input image buffer from multer.
 * @param {string} outputPath - The path to save the compressed image.
 * @returns {Promise<void>}
 */
export const compressImage = (buffer, outputPath) => {
  return sharp(buffer)
    .resize({ width: 1080 }) // Resize to a width of 1080px, auto height
    .jpeg({ quality: 80 }) // Compress to JPEG with 80% quality
    .toFile(outputPath);
};
