// COMMENTED OUT - Transformation photos feature disabled
/*
'use client';

import { useState } from 'react';
import { TransformationPhotoUpload } from '@/components/transformation-photo-upload';
import { TransformationPhotoGallery } from '@/components/transformation-photo-gallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Image } from 'lucide-react';
import { toast } from 'sonner';

interface TransformationTabsProps {
  userId: string;
}

export function TransformationTabs({ userId }: TransformationTabsProps) {
  const [activeTab, setActiveTab] = useState('gallery');

  const handlePhotoSelect = (photoId: string) => {
    console.log('Selected photo:', photoId);
    // You can implement photo detail view here
    toast.info(`Selected photo: ${photoId}`);
  };

  const handleUploadComplete = () => {
    // Refresh gallery or show success message
    console.log('Photo uploaded successfully');
    toast.success('Photo uploaded successfully!');
    // Switch to gallery tab to show the new photo
    setActiveTab('gallery');
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="gallery" className="flex items-center gap-2">
          <Image className="w-4 h-4" />
          Photo Gallery
        </TabsTrigger>
        <TabsTrigger value="upload" className="flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Upload Photo
        </TabsTrigger>
      </TabsList>

      <TabsContent value="gallery" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Transformation Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <TransformationPhotoGallery 
              userId={userId}
              onPhotoSelect={handlePhotoSelect}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="upload" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <TransformationPhotoUpload 
              userId={userId}
              onUploadComplete={handleUploadComplete}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
*/ 