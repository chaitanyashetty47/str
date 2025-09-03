import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/utils/prisma/prismaClient';
import { v4 as uuidv4 } from 'uuid';

// Validation schema
const savePhotoSchema = z.object({
  userId: z.string().uuid(),
  imageUrl: z.string().url(),
  photoType: z.enum(['BEFORE', 'AFTER']),
  privacySetting: z.enum(['PRIVATE', 'PUBLIC']),
  description: z.string().optional(),
  photoDate: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  console.log('💾 [API] Starting transformation photo save request');
  
  try {
    const body = await request.json();
    console.log('📝 [API] Request body:', JSON.stringify(body, null, 2));

    // Validate input
    const validatedData = savePhotoSchema.parse(body);
    console.log('✅ [API] Input validation passed');

    const { userId, imageUrl, photoType, privacySetting, description, photoDate } = validatedData;

    console.log('🗄️ [API] Creating photo record in database...');
    console.log('🔗 [API] Image URL to save:', imageUrl);

    // Save photo metadata to database
    const photo = await prisma.transformation_photos.create({
      data: {
        id: uuidv4(),
        user_id: userId,
        image_url: imageUrl,
        photo_type: photoType,
        privacy_setting: privacySetting,
        description,
        photo_date: photoDate ? new Date(photoDate) : new Date(),
      },
    });

    console.log('✅ [API] Photo saved successfully:', {
      photoId: photo.id,
      imageUrl: photo.image_url,
      photoType: photo.photo_type,
      privacySetting: photo.privacy_setting
    });

    return NextResponse.json({
      success: true,
      data: {
        photoId: photo.id,
      },
    });

  } catch (error) {
    console.error('💥 [API] Error saving transformation photo:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save photo metadata' 
      },
      { status: 500 }
    );
  }
}