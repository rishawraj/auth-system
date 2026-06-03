import type { Area } from "react-easy-crop";

export async function getCroppedCircularImage(
  imgSrc: string,
  pixelCrop: Area,
): Promise<string> {
  const image = await createImage(imgSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // draw a circle clip path

  ctx?.beginPath();
  ctx?.arc(
    pixelCrop.width / 2, // center x
    pixelCrop.height / 2, // center y
    pixelCrop.width / 2, // radius
    0,
    Math.PI * 2,
  );
  ctx?.closePath();
  ctx?.clip();

  ctx?.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  // png
  return canvas.toDataURL("image/png");
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
