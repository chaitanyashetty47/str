import { createSafeAction, ActionState } from '@/lib/create-safe-action';
import { z } from 'zod';
import prisma from '@/utils/prisma/server';
import { v4 as uuidv4 } from 'uuid';

// Validation schema
const schema = z.object({
  userId: z.string().uuid(),
  imageUrl: z.string().url(),
  photoType: z.enum(['BEFORE', 'AFTER']),
  privacySetting: z.enum(['PRIVATE', 'PUBLIC']),
  description: z.string().optional(),
  photoDate: z.date().optional(),
});

// Action type
type InputType = z.infer<typeof schema>;
type ReturnType = {
  photoId: string;
};

// Server action
const handler = async (data: InputType): Promise<ActionState<InputType, ReturnType>> => {
  console.log('💾 [SA] Starting to save transformation photo metadata');
  console.log('📝 [SA] Input data:', JSON.stringify(data, null, 2));
  
  try {
    const { userId, imageUrl, photoType, privacySetting, description, photoDate } = data;

    console.log('🗄️ [SA] Creating photo record in database...');
    console.log('🔗 [SA] Image URL to save:', imageUrl);

    // Save photo metadata to database
    const photo = await prisma.transformation_photos.create({
      data: {
        id: uuidv4(),
        user_id: userId,
        image_url: imageUrl,  
        photo_type: photoType,
        privacy_setting: privacySetting,
        description,
        photo_date: photoDate || new Date(),
      },
    });

    console.log('✅ [SA] Photo saved successfully:', {
      photoId: photo.id,
      imageUrl: photo.image_url,
      photoType: photo.photo_type,
      privacySetting: photo.privacy_setting
    });

    return {
      data: {
        photoId: photo.id,
      },
    };

  } catch (error) {
    console.error('💥 [SA] Error saving transformation photo:', error);
    return {
      error: 'Failed to save photo metadata',
    };
  }
};

export const saveTransformationPhoto = createSafeAction(schema, handler); 