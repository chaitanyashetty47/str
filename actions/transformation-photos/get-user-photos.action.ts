import { createSafeAction, ActionState } from '@/lib/create-safe-action';
import { z } from 'zod';
import prisma from '@/utils/prisma/server';

// Validation schema
const schema = z.object({
  userId: z.string().uuid(),
  photoType: z.enum(['BEFORE', 'AFTER']).optional(),
  privacySetting: z.enum(['PRIVATE', 'PUBLIC']).optional(),
  limit: z.number().min(1).max(100),
  offset: z.number().min(0),
});

// Action type
type InputType = z.infer<typeof schema>;
type ReturnType = Array<{
  id: string;
  imageUrl: string;
  photoType: 'BEFORE' | 'AFTER';
  privacySetting: 'PRIVATE' | 'PUBLIC';
  description?: string;
  photoDate: Date;
  uploadedAt?: Date;
}>;

// Server action
const handler = async (data: InputType): Promise<ActionState<InputType, ReturnType>> => {
  try {
    const { userId, photoType, privacySetting, limit, offset } = data;

    // Build where clause
    const whereClause: any = {
      user_id: userId,
    };

    if (photoType) {
      whereClause.photo_type = photoType;
    }

    if (privacySetting) {
      whereClause.privacy_setting = privacySetting;
    }

    // Fetch photos from database
    const photos = await prisma.transformation_photos.findMany({
      where: whereClause,
      select: {
        id: true,
        image_url: true,
        photo_type: true,
        privacy_setting: true,
        description: true,
        photo_date: true,
        uploaded_at: true,
      },
      orderBy: {
        uploaded_at: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return {
      data: photos.map((photo: any) => ({
        id: photo.id,
        imageUrl: photo.image_url,
        photoType: photo.photo_type,
        privacySetting: photo.privacy_setting,
        description: photo.description || undefined,
        photoDate: photo.photo_date,
        uploadedAt: photo.uploaded_at || undefined,
      })),
    };

  } catch (error) {
    console.error('Error fetching transformation photos:', error);
    return {
      error: 'Failed to fetch photos',
    };
  }
};

export const getUserPhotos = createSafeAction(schema, handler); 