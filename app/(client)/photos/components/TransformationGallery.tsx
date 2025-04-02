"use client";

import { useState } from "react";
import Image from "next/image";
import { Database } from "@/utils/supabase/types";
import { format } from "date-fns";

type TransformationPhoto = Database["public"]["Tables"]["transformation_photos"]["Row"];

interface TransformationGalleryProps {
  beforePhotos: TransformationPhoto[];
  afterPhotos: TransformationPhoto[];
}

export default function TransformationGallery({
  beforePhotos,
  afterPhotos,
}: TransformationGalleryProps) {
  // State for selected photos in the comparison view
  const [selectedBeforePhoto, setSelectedBeforePhoto] = useState<TransformationPhoto | null>(
    beforePhotos.length > 0 ? beforePhotos[0] : null
  );
  
  const [selectedAfterPhoto, setSelectedAfterPhoto] = useState<TransformationPhoto | null>(
    afterPhotos.length > 0 ? afterPhotos[0] : null
  );

  // Format date to be more user friendly
  const formatPhotoDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-8">
      {/* Main comparison view */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Before Photo */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Before</h3>
          {selectedBeforePhoto ? (
            <div className="space-y-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
                <Image
                  src={selectedBeforePhoto.image_url}
                  alt="Before transformation photo"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {formatPhotoDate(selectedBeforePhoto.photo_date)}
                </p>
                {selectedBeforePhoto.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedBeforePhoto.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-square w-full flex items-center justify-center bg-gray-100 rounded-md">
              <p className="text-gray-500">No before photos uploaded yet</p>
            </div>
          )}
        </div>

        {/* After Photo */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">After</h3>
          {selectedAfterPhoto ? (
            <div className="space-y-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
                <Image
                  src={selectedAfterPhoto.image_url}
                  alt="After transformation photo"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {formatPhotoDate(selectedAfterPhoto.photo_date)}
                </p>
                {selectedAfterPhoto.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedAfterPhoto.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-square w-full flex items-center justify-center bg-gray-100 rounded-md">
              <p className="text-gray-500">No after photos uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo selection galleries */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Before photos thumbnails */}
        <div>
          <h3 className="text-lg font-medium mb-3">Before Photos</h3>
          {beforePhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {beforePhotos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedBeforePhoto(photo)}
                  className={`relative aspect-square overflow-hidden rounded-md ${
                    selectedBeforePhoto?.id === photo.id
                      ? "ring-2 ring-blue-500"
                      : "ring-1 ring-gray-200"
                  }`}
                >
                  <Image
                    src={photo.image_url}
                    alt={`Photo from ${formatPhotoDate(photo.photo_date)}`}
                    fill
                    sizes="(max-width: 768px) 33vw, 16vw"
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                    {formatPhotoDate(photo.photo_date)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No photos available</p>
          )}
        </div>

        {/* After photos thumbnails */}
        <div>
          <h3 className="text-lg font-medium mb-3">After Photos</h3>
          {afterPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {afterPhotos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedAfterPhoto(photo)}
                  className={`relative aspect-square overflow-hidden rounded-md ${
                    selectedAfterPhoto?.id === photo.id
                      ? "ring-2 ring-blue-500"
                      : "ring-1 ring-gray-200"
                  }`}
                >
                  <Image
                    src={photo.image_url}
                    alt={`Photo from ${formatPhotoDate(photo.photo_date)}`}
                    fill
                    sizes="(max-width: 768px) 33vw, 16vw"
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                    {formatPhotoDate(photo.photo_date)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No photos available</p>
          )}
        </div>
      </div>
    </div>
  );
} 