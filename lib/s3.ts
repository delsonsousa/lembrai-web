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
  const safeFileName = fileName
    ?.replace(/[\r\n]/g, "")
    .replaceAll('"', "")
    .slice(0, 180);

  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: getS3Bucket(),
      Key: s3Key,
      ResponseContentDisposition: safeFileName
        ? `attachment; filename="${safeFileName}"`
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

async function streamToBytes(stream: unknown) {
  if (!stream || typeof stream !== "object") return new Uint8Array();

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array | Buffer | string>) {
    if (typeof chunk === "string") {
      chunks.push(new TextEncoder().encode(chunk));
    } else {
      chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
    }
  }

  const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const bytes = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  return bytes;
}

export async function getObjectPrefixBytes(s3Key: string, byteCount = 4096) {
  const response = await getS3Client().send(
    new GetObjectCommand({
      Bucket: getS3Bucket(),
      Key: s3Key,
      Range: `bytes=0-${Math.max(byteCount - 1, 0)}`,
    })
  );

  return streamToBytes(response.Body);
}

export async function deleteObject(s3Key: string) {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getS3Bucket(),
      Key: s3Key,
    })
  );
}
