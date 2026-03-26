/**
 * Utility to crop an image using canvas and apply CSS-like filters.
 * Used by PhotoEditor to produce the final base64 image.
 */

export interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FilterOptions {
  brightness: number;  // 0–200 (100 = default)
  contrast: number;    // 0–200 (100 = default)
  grayscale: number;   // 0–100 (0 = no grayscale)
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) +
      Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) +
      Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Crops & rotates the image, applies filters, and returns a base64 data URL.
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CroppedAreaPixels,
  rotation = 0,
  filters: FilterOptions = { brightness: 100, contrast: 100, grayscale: 0 }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("No 2d context");

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to center of canvas
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Extract the cropped area
  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) throw new Error("No 2d context");

  // Set output size — cap at 600px for resume use
  const outputSize = Math.min(600, pixelCrop.width, pixelCrop.height);
  croppedCanvas.width = outputSize;
  croppedCanvas.height = outputSize;

  // Apply filters
  croppedCtx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%)`;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  // Return as base64 JPEG (good compression for photos)
  return croppedCanvas.toDataURL("image/jpeg", 0.92);
}
