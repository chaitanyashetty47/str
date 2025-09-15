// Transformation photos feature disabled
// This file is kept for future implementation

export async function GET() {
  return new Response('Feature disabled', { status: 501 });
}

// import { NextRequest, NextResponse } from 'next/server';
// import { z } from 'zod';
// import prisma from '@/utils/prisma/prismaClient';

// // Validation schema for query parameters
// const listPhotosSchema = z.object({
//   userId: z.string().uuid(),
//   photoType: z.enum(['BEFORE', 'AFTER']).nullable().transform(val => val || undefined).optional(),
//   privacySetting: z.enum(['PRIVATE', 'PUBLIC']).nullable().transform(val => val || undefined).optional(),
//   limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)).default('20'),
//   offset: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(0)).default('0'),
// });

// export async function GET(request: NextRequest) {
//   console.log('📋 [API] Starting transformation photos list request');
  
//   try {
//     // Parse query parameters
//     const { searchParams } = new URL(request.url);
//     const queryParams = {
//       userId: searchParams.get('userId'),
//       photoType: searchParams.get('photoType'),
//       privacySetting: searchParams.get('privacySetting'),
//       limit: searchParams.get('limit') || '20',
//       offset: searchParams.get('offset') || '0',
//     };

//     console.log('📝 [API] Query params:', JSON.stringify(queryParams, null, 2));

//     // Validate input
//     const validatedData = listPhotosSchema.parse(queryParams);
//     console.log('✅ [API] Input validation passed');

//     const { userId, photoType, privacySetting, limit, offset } = validatedData;

//     // Build where clause
//     const whereClause: any = {
//       user_id: userId,
//     };

//     if (photoType) {
//       whereClause.photo_type = photoType;
//     }

//     if (privacySetting) {
//       whereClause.privacy_setting = privacySetting;
//     }

//     console.log('🔍 [API] Database query where clause:', whereClause);

//     // Fetch photos from database
//     const photos = await prisma.transformation_photos.findMany({
//       where: whereClause,
//       select: {
//         id: true,
//         image_url: true,
//         photo_type: true,
//         privacy_setting: true,
//         description: true,
//         photo_date: true,
//         uploaded_at: true,
//       },
//       orderBy: {
//         uploaded_at: 'desc',
//       },
//       take: limit,
//       skip: offset,
//     });

//     console.log(`✅ [API] Found ${photos.length} photos`);

//     // Transform data for response
//     const transformedPhotos = photos.map((photo) => ({
//       id: photo.id,
//       imageUrl: photo.image_url,
//       photoType: photo.photo_type,
//       privacySetting: photo.privacy_setting,
//       description: photo.description || undefined,
//       photoDate: photo.photo_date,
//       uploadedAt: photo.uploaded_at || undefined,
//     }));

//     return NextResponse.json({
//       success: true,
//       data: transformedPhotos,
//       meta: {
//         total: photos.length,
//         limit,
//         offset,
//       },
//     });

//   } catch (error) {
//     console.error('💥 [API] Error fetching transformation photos:', error);
    
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { 
//           success: false,
//           error: 'Invalid query parameters',
//           details: error.errors 
//         },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { 
//         success: false,
//         error: 'Failed to fetch photos' 
//       },
//       { status: 500 }
//     );
//   }
// }