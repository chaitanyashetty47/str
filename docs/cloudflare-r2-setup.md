# Cloudflare R2 Setup for Transformation Photos

This guide explains how to set up Cloudflare R2 object storage for storing transformation photos in your Strentor application.

## Overview

Cloudflare R2 is S3-compatible object storage with **zero egress fees**, making it perfect for storing transformation photos. The setup includes:

- **File Storage**: Photos stored in Cloudflare R2
- **Metadata Storage**: Photo information stored in your Neon database
- **Secure Upload**: Presigned URLs for direct client-to-R2 uploads
- **Privacy Controls**: Public/private photo settings

## Prerequisites

1. Cloudflare account
2. Neon database (already configured)
3. Next.js application (already set up)

## Step 1: Cloudflare R2 Setup

### 1.1 Create Cloudflare Account
- Go to [cloudflare.com](https://cloudflare.com)
- Sign up for a free account

### 1.2 Create R2 Bucket
1. Navigate to **R2** in the Cloudflare dashboard
2. Click **Create bucket**
3. Name: `strentor-transformation-photos`
4. Click **Create bucket**

### 1.3 Generate API Credentials
1. Go to **R2** → **Manage R2 API tokens**
2. Click **Create API token**
3. Select **Object Read & Write** permissions
4. Copy the **Access Key ID** and **Secret Access Key**

### 1.4 Get Account ID
1. In Cloudflare dashboard, look for your **Account ID**
2. Copy this ID for configuration

### 1.5 Enable Public Access (Optional)
For public photo access:
1. Go to your R2 bucket
2. Click **Settings** → **Public access**
3. Enable public access
4. Note your public URL: `https://pub-xxxxxxxx.r2.dev`

## Step 2: Environment Configuration

Add these variables to your `.env.local`:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=strentor-transformation-photos
R2_PUBLIC_BASE_URL=https://pub-xxxxxxxx.r2.dev
```

## Step 3: Installation

Install required dependencies:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Step 4: File Structure

The implementation includes:

```
├── utils/r2-client.ts                           # R2 client configuration
├── app/api/upload/transformation-photo/route.ts # Upload API endpoint
├── actions/transformation-photos/
│   ├── save-transformation-photo.action.ts      # Save metadata action
│   └── get-user-photos.action.ts               # Fetch photos action
├── components/
│   ├── transformation-photo-upload.tsx         # Upload component
│   └── transformation-photo-gallery.tsx        # Gallery component
└── docs/cloudflare-r2-setup.md                 # This documentation
```

## Step 5: Usage

### Upload Component
```tsx
import { TransformationPhotoUpload } from '@/components/transformation-photo-upload';

<TransformationPhotoUpload 
  userId="user-uuid" 
  onUploadComplete={() => console.log('Upload complete')} 
/>
```

### Gallery Component
```tsx
import { TransformationPhotoGallery } from '@/components/transformation-photo-gallery';

<TransformationPhotoGallery 
  userId="user-uuid" 
  onPhotoSelect={(photoId) => console.log('Selected:', photoId)} 
/>
```

## Step 6: Upload Flow

1. **Client Request**: User selects photo and clicks upload
2. **Presigned URL**: Server generates secure upload URL
3. **Direct Upload**: Client uploads directly to R2
4. **Metadata Save**: Server saves photo info to database
5. **Success**: User sees uploaded photo in gallery

## Step 7: Security Considerations

### File Validation
- File type: Only images allowed
- File size: Max 10MB per photo
- Content validation: Server-side checks

### Privacy Controls
- **PRIVATE**: Only user can see
- **PUBLIC**: Visible to others (for community features)

### Access Control
- User can only upload to their own folder
- Presigned URLs expire in 5 minutes
- Server validates user ownership

## Step 8: Database Schema

Your existing `transformation_photos` table:

```sql
CREATE TABLE transformation_photos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users_profile(id),
  image_url TEXT NOT NULL,           -- R2 URL
  uploaded_at TIMESTAMP DEFAULT NOW(),
  privacy_setting photo_privacy DEFAULT 'PRIVATE',
  photo_type photo_type NOT NULL,    -- 'BEFORE' or 'AFTER'
  description TEXT,
  photo_date DATE DEFAULT NOW()
);
```

## Step 9: Testing

### Test Upload Flow
1. Start your development server
2. Navigate to photo upload page
3. Select an image file
4. Choose photo type and privacy
5. Click upload
6. Verify photo appears in gallery

### Test API Endpoints
```bash
# Test presigned URL generation
curl -X POST http://localhost:3000/api/upload/transformation-photo \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.jpg","contentType":"image/jpeg","userId":"user-uuid","photoType":"BEFORE"}'
```

## Step 10: Production Deployment

### Environment Variables
Ensure all R2 environment variables are set in production:
- Vercel: Add to project settings
- Other platforms: Add to environment configuration

### CORS Configuration
If needed, configure CORS for your R2 bucket:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### Monitoring
Monitor upload success rates and errors:
- Check R2 dashboard for storage usage
- Monitor API endpoint logs
- Track upload failures

## Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check R2 credentials
   - Verify bucket name
   - Ensure file size < 10MB

2. **Presigned URL Expires**
   - URLs expire in 5 minutes
   - Generate new URL if needed

3. **Database Errors**
   - Check Prisma connection
   - Verify user ID format
   - Check database permissions

### Debug Steps
1. Check browser console for errors
2. Verify environment variables
3. Test R2 credentials manually
4. Check database logs

## Cost Considerations

### Cloudflare R2 Pricing
- **Storage**: $0.015 per GB per month
- **Class A Operations**: $4.50 per million
- **Class B Operations**: $0.36 per million
- **Egress**: $0 (zero egress fees!)

### Optimization Tips
- Compress images before upload
- Use appropriate image formats (WebP, JPEG)
- Implement lazy loading in gallery
- Consider image resizing for thumbnails

## Next Steps

1. **Image Optimization**: Add image compression
2. **CDN Integration**: Use Cloudflare CDN for faster delivery
3. **Backup Strategy**: Implement photo backup system
4. **Analytics**: Track photo upload metrics
5. **Community Features**: Enable public photo sharing

## Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [Neon Database Documentation](https://neon.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) 