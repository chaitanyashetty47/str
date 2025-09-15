// COMMENTED OUT - Transformation photos feature disabled
/*
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Removed server action import - now using API route
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Eye, EyeOff, Calendar, FileText } from 'lucide-react';

interface TransformationPhotoGalleryProps {
  userId: string;
  onPhotoSelect?: (photoId: string) => void;
}

interface Photo {
  id: string;
  imageUrl: string;
  photoType: 'BEFORE' | 'AFTER';
  privacySetting: 'PRIVATE' | 'PUBLIC';
  description?: string;
  photoDate: Date;
  uploadedAt?: Date;
}

export function TransformationPhotoGallery({ userId, onPhotoSelect }: TransformationPhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoTypeFilter, setPhotoTypeFilter] = useState<'BEFORE' | 'AFTER' | 'ALL'>('ALL');
  const [privacyFilter, setPrivacyFilter] = useState<'PRIVATE' | 'PUBLIC' | 'ALL'>('ALL');

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      console.log('📋 [GALLERY] Fetching photos for user:', userId);
      
      // Build query parameters
      const params = new URLSearchParams({
        userId,
        limit: '50',
        offset: '0',
      });

      if (photoTypeFilter !== 'ALL') {
        params.append('photoType', photoTypeFilter);
      }

      if (privacyFilter !== 'ALL') {
        params.append('privacySetting', privacyFilter);
      }

      console.log('🔍 [GALLERY] Query params:', params.toString());

      const response = await fetch(`/api/transformation-photos/list?${params.toString()}`);
      console.log('📡 [GALLERY] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [GALLERY] Fetch failed:', errorData);
        throw new Error(errorData.error || 'Failed to fetch photos');
      }

      const result = await response.json();
      console.log('📊 [GALLERY] Fetch result:', result);

      if (result.success && result.data) {
        setPhotos(result.data);
        console.log(`✅ [GALLERY] Loaded ${result.data.length} photos`);
      } else {
        throw new Error(result.error || 'Failed to fetch photos');
      }
    } catch (error) {
      console.error('💥 [GALLERY] Error fetching photos:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [userId, photoTypeFilter, privacyFilter]);

  // No need for client-side filtering since we filter on the server
  const filteredPhotos = photos;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading photos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */
//       <div className="flex gap-4">
//         <div className="space-y-2">
//           <label className="text-sm font-medium">Photo Type</label>
//           <Select value={photoTypeFilter} onValueChange={(value: 'BEFORE' | 'AFTER' | 'ALL') => setPhotoTypeFilter(value)}>
//             <SelectTrigger className="w-32">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="ALL">All</SelectItem>
//               <SelectItem value="BEFORE">Before</SelectItem>
//               <SelectItem value="AFTER">After</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         <div className="space-y-2">
//           <label className="text-sm font-medium">Privacy</label>
//           <Select value={privacyFilter} onValueChange={(value: 'PRIVATE' | 'PUBLIC' | 'ALL') => setPrivacyFilter(value)}>
//             <SelectTrigger className="w-32">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="ALL">All</SelectItem>
//               <SelectItem value="PRIVATE">Private</SelectItem>
//               <SelectItem value="PUBLIC">Public</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       {/* Photo Grid */}
//       {filteredPhotos.length === 0 ? (
//         <Card>
//           <CardContent className="flex items-center justify-center p-8">
//             <div className="text-center space-y-2">
//               <div className="text-muted-foreground">No photos found</div>
//               <div className="text-sm text-muted-foreground">
//                 Upload your first transformation photo to get started
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {filteredPhotos.map((photo) => (
//             <Card key={photo.id} className="overflow-hidden">
//               <div className="aspect-square relative">
//                 <img
//                   src={photo.imageUrl}
//                   alt={`${photo.photoType} transformation photo`}
//                   className="w-full h-full object-cover"
//                   loading="lazy"
//                 />
//                 <div className="absolute top-2 right-2 flex gap-1">
//                   <Badge variant={photo.photoType === 'BEFORE' ? 'secondary' : 'default'}>
//                     {photo.photoType}
//                   </Badge>
//                   <Badge variant="outline" className="flex items-center gap-1">
//                     {photo.privacySetting === 'PRIVATE' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
//                     {photo.privacySetting}
//                   </Badge>
//                 </div>
//               </div>
              
//               <CardContent className="p-4">
//                 <div className="space-y-2">
//                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                     <Calendar className="w-4 h-4" />
//                     <span>{format(photo.photoDate, 'MMM dd, yyyy')}</span>
//                   </div>
                  
//                   {photo.description && (
//                     <div className="flex items-start gap-2 text-sm">
//                       <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
//                       <p className="text-muted-foreground line-clamp-2">{photo.description}</p>
//                     </div>
//                   )}
                  
//                   {onPhotoSelect && (
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => onPhotoSelect(photo.id)}
//                       className="w-full"
//                     >
//                       View Details
//                     </Button>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
// */ 