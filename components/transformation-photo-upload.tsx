// COMMENTED OUT - Transformation photos feature disabled
/*
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Removed server action import - now using API route
import { toast } from 'sonner';

// COMMENTED OUT - Transformation photos feature disabled
/*
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Removed server action import - now using API route
import { toast } from 'sonner';

interface TransformationPhotoUploadProps {
  userId: string;
  onUploadComplete?: () => void;
}

export function TransformationPhotoUpload({ userId, onUploadComplete }: TransformationPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState<'BEFORE' | 'AFTER'>('BEFORE');
  const [privacySetting, setPrivacySetting] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Please select a file smaller than 10MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    console.log('🚀 [UPLOAD] Starting upload process');
    console.log('📁 [UPLOAD] File details:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size
    });

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL
      console.log('🔗 [UPLOAD] Step 1: Getting presigned URL...');
      const presignResponse = await fetch('/api/upload/transformation-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type,
          userId,
          photoType,
          privacySetting,
        }),
      });

      console.log('📡 [UPLOAD] Presign response status:', presignResponse.status);
      
      if (!presignResponse.ok) {
        const errorText = await presignResponse.text();
        console.error('❌ [UPLOAD] Presign failed:', errorText);
        throw new Error(`Failed to get upload URL: ${errorText}`);
      }

      const presignData = await presignResponse.json();
      console.log('✅ [UPLOAD] Presign data received:', presignData);
      
      const { presignedUrl, objectKey, publicFileUrl } = presignData;

      // Step 2: Upload file to R2
      console.log('☁️ [UPLOAD] Step 2: Uploading file to R2...');
      console.log('🔗 [UPLOAD] Presigned URL:', presignedUrl);
      console.log('🔑 [UPLOAD] Object key:', objectKey);
      
      setUploadProgress(50);
      
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      console.log('📡 [UPLOAD] Upload response status:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ [UPLOAD] Upload failed:', errorText);
        throw new Error(`Failed to upload file: ${errorText}`);
      }

      console.log('✅ [UPLOAD] File uploaded successfully to R2');
      setUploadProgress(75);

      // Step 3: Save metadata to database
      console.log('💾 [UPLOAD] Step 3: Saving metadata to database...');
      const imageUrl = publicFileUrl || `https://${process.env.NEXT_PUBLIC_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${objectKey}`;
      console.log('🖼️ [UPLOAD] Final image URL:', imageUrl);
      
      const saveResponse = await fetch('/api/transformation-photos/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          imageUrl,
          photoType,
          privacySetting,
          description: description || undefined,
          photoDate: new Date().toISOString(),
        }),
      });

      console.log('📡 [UPLOAD] Save response status:', saveResponse.status);

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        console.error('❌ [UPLOAD] Save failed:', errorData);
        throw new Error(errorData.error || 'Failed to save photo metadata');
      }

      const saveResult = await saveResponse.json();
      console.log('📊 [UPLOAD] Save result:', saveResult);

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save photo metadata');
      }

      setUploadProgress(100);
      console.log('🎉 [UPLOAD] Upload process completed successfully');

      toast.success('Your transformation photo has been uploaded');

      // Reset form
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete?.();

    } catch (error) {
      console.error('💥 [UPLOAD] Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Upload Transformation Photo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo Type Selection */
//         <div className="space-y-2">
//           <Label htmlFor="photoType">Photo Type</Label>
//           <Select value={photoType} onValueChange={(value: 'BEFORE' | 'AFTER') => setPhotoType(value)}>
//             <SelectTrigger>
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="BEFORE">Before</SelectItem>
//               <SelectItem value="AFTER">After</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Privacy Setting */}
//         <div className="space-y-2">
//           <Label htmlFor="privacy">Privacy Setting</Label>
//           <Select value={privacySetting} onValueChange={(value: 'PRIVATE' | 'PUBLIC') => setPrivacySetting(value)}>
//             <SelectTrigger>
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="PRIVATE">Private</SelectItem>
//               <SelectItem value="PUBLIC">Public</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* File Upload */}
//         <div className="space-y-2">
//           <Label htmlFor="photo">Select Photo</Label>
//           <Input
//             ref={fileInputRef}
//             id="photo"
//             type="file"
//             accept="image/*"
//             onChange={handleFileSelect}
//             disabled={isUploading}
//           />
//           {selectedFile && (
//             <p className="text-sm text-muted-foreground">
//               Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
//             </p>
//           )}
//         </div>

//         {/* Description */}
//         <div className="space-y-2">
//           <Label htmlFor="description">Description (Optional)</Label>
//           <Textarea
//             id="description"
//             placeholder="Add a description for your transformation photo..."
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             disabled={isUploading}
//           />
//         </div>

//         {/* Upload Progress */}
//         {isUploading && (
//           <div className="space-y-2">
//             <div className="w-full bg-gray-200 rounded-full h-2">
//               <div
//                 className="bg-blue-600 h-2 rounded-full transition-all duration-300"
//                 style={{ width: `${uploadProgress}%` }}
//               />
//             </div>
//             <p className="text-sm text-muted-foreground">
//               Uploading... {uploadProgress}%
//             </p>
//           </div>
//         )}

//         {/* Upload Button */}
//         <Button
//           onClick={handleUpload}
//           disabled={!selectedFile || isUploading}
//           className="w-full"
//         >
//           {isUploading ? 'Uploading...' : 'Upload Photo'}
//         </Button>
//       </CardContent>
//     </Card>
//   );
// }
// */ 