// Transformation photos feature disabled
// This file is kept for future implementation

export async function GET() {
  return new Response('Feature disabled', { status: 501 });
}

// import { NextRequest, NextResponse } from 'next/server';
// import { PutObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { r2Client, R2_CONFIG } from '@/utils/r2-client';
// import { randomUUID } from 'crypto';

// export async function POST(request: NextRequest) {
//   console.log('🚀 [API] Starting transformation photo upload presign request');
  
//   try {
//     const body = await request.json();
//     console.log('📦 [API] Request body:', JSON.stringify(body, null, 2));
    
//     const { fileName, contentType, userId, photoType, privacySetting } = body;

//     // Validate required fields
//     if (!fileName || !contentType || !userId || !photoType) {
//       console.error('❌ [API] Missing required fields:', { fileName, contentType, userId, photoType });
//       return NextResponse.json(
//         { error: 'Missing required fields: fileName, contentType, userId, photoType' },
//         { status: 400 }
//       );
//     }

//     console.log('✅ [API] All required fields present');

//     // Generate unique object key
//     const fileExtension = fileName.split('.').pop();
//     const objectKey = `transformation-photos/${userId}/${photoType.toLowerCase()}/${randomUUID()}.${fileExtension}`;
//     console.log('🔑 [API] Generated object key:', objectKey);

//     // Log R2 configuration
//     console.log('⚙️ [API] R2 Config:', {
//       bucket: R2_CONFIG.bucket,
//       publicBaseUrl: R2_CONFIG.publicBaseUrl,
//       accountId: R2_CONFIG.accountId
//     });

//     // Create presigned URL for upload
//     const command = new PutObjectCommand({
//       Bucket: R2_CONFIG.bucket,
//       Key: objectKey,
//       ContentType: contentType,
//     });

//     console.log('🔗 [API] Creating presigned URL...');
//     const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 }); // 5 minutes
//     console.log('✅ [API] Presigned URL created successfully');

//     // Generate public URL if bucket is public
//     const publicFileUrl = R2_CONFIG.publicBaseUrl 
//       ? `${R2_CONFIG.publicBaseUrl}/${objectKey}`
//       : null;

//     console.log('🌐 [API] Public URL:', publicFileUrl);

//     const response = {
//       success: true,
//       presignedUrl,
//       objectKey,
//       publicFileUrl,
//     };

//     console.log('📤 [API] Sending response:', JSON.stringify(response, null, 2));
//     return NextResponse.json(response);

//   } catch (error) {
//     console.error('💥 [API] Upload presign error:', error);
//     return NextResponse.json(
//       { error: 'Failed to generate upload URL' },
//       { status: 500 }
//     );
//   }
// } 