import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3Client: S3Client | null = null;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: requiredEnv("AWS_REGION"),
      credentials: {
        accessKeyId: requiredEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: requiredEnv("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }

  return s3Client;
}

export function getS3Bucket() {
  return requiredEnv("AWS_S3_BUCKET");
}

export async function createUploadUrl(s3Key: string, mimeType: string) {
  return getSignedUrl(
    getS3Client(),
    new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: s3Key,
      ContentType: mimeType,
    }),
    { expiresIn: 5 * 60 }
  );
}

export async function createReadUrl(s3Key: string, fileName?: string) {
  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: getS3Bucket(),
      Key: s3Key,
      ResponseContentDisposition: fileName
        ? `attachment; filename="${fileName.replaceAll('"', "")}"`
        : undefined,
    }),
    { expiresIn: 15 * 60 }
  );
}

export async function getObjectMetadata(s3Key: string) {
  return getS3Client().send(
    new HeadObjectCommand({
      Bucket: getS3Bucket(),
      Key: s3Key,
    })
  );
}

export async function deleteObject(s3Key: string) {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getS3Bucket(),
      Key: s3Key,
    })
  );
}
