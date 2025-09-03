import { S3Client } from '@aws-sdk/client-s3';

// Debug R2 configuration
console.log('🔧 [R2] Environment variables check:', {
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? '✅ Set' : '❌ Missing',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ? '✅ Set' : '❌ Missing',
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL ? '✅ Set' : '❌ Missing',
});

// Cloudflare R2 S3-compatible client
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// R2 bucket configuration
export const R2_CONFIG = {
  bucket: process.env.R2_BUCKET_NAME!,
  publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  accountId: process.env.R2_ACCOUNT_ID!,
};

console.log('⚙️ [R2] Client configuration:', {
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  bucket: R2_CONFIG.bucket,
  publicBaseUrl: R2_CONFIG.publicBaseUrl,
}); 