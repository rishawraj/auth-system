import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "./r2.js";

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  // public url of uploaded file
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
