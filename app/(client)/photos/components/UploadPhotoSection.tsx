"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { Database } from "@/utils/supabase/types";

interface UploadPhotoSectionProps {
  userId: string;
}

type TransformationPhoto = Database["public"]["Tables"]["transformation_photos"]["Row"];

export default function UploadPhotoSection({ userId }: UploadPhotoSectionProps) {
  const supabase = createClient();
  const router = useRouter();
  
  // Form states
  const [photoType, setPhotoType] = useState<"before" | "after">("before");
  const [description, setDescription] = useState("");
  const [photoDate, setPhotoDate] = useState<Date>(new Date());
  const [privacySetting, setPrivacySetting] = useState<"private" | "public">("private");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Existing photos states
  const [existingPhotos, setExistingPhotos] = useState<{
    before: TransformationPhoto | null;
    after: TransformationPhoto | null;
  }>({ before: null, after: null });
  const [currentPhotoToEdit, setCurrentPhotoToEdit] = useState<TransformationPhoto | null>(null);
  
  // UI states
  const [uploading, setUploading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's existing photos on component mount
  useEffect(() => {
    const fetchUserPhotos = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from("transformation_photos")
          .select("*")
          .eq("user_id", userId)
          .order("photo_date", { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Get the latest before and after photos
        const beforePhoto = data?.find(photo => photo.photo_type === "before") || null;
        const afterPhoto = data?.find(photo => photo.photo_type === "after") || null;
        
        setExistingPhotos({
          before: beforePhoto,
          after: afterPhoto
        });
      } catch (error) {
        console.error("Error fetching user photos:", error);
        setError("Failed to load existing photos");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPhotos();
  }, [userId, supabase]);
  
  // Reset form fields
  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription("");
    setPhotoDate(new Date());
    setPrivacySetting("private");
    setCurrentPhotoToEdit(null);
    setError(null);
  };
  
  // Handle photo type selection - load existing photo data if available
  useEffect(() => {
    const currentTypePhoto = photoType === "before" ? existingPhotos.before : existingPhotos.after;
    
    if (currentTypePhoto) {
      setCurrentPhotoToEdit(currentTypePhoto);
      setDescription(currentTypePhoto.description || "");
      setPhotoDate(new Date(currentTypePhoto.photo_date));
      setPrivacySetting(currentTypePhoto.privacy_setting || "private");
      setPreviewUrl(currentTypePhoto.image_url);
    } else {
      // Reset form if no photo exists for this type
      setCurrentPhotoToEdit(null);
      setDescription("");
      setPhotoDate(new Date());
      setPrivacySetting("private");
      setPreviewUrl(null);
    }
  }, [photoType, existingPhotos]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    
    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB");
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Extract storage file path from full URL
  const getStoragePathFromUrl = (url: string) => {
    const baseUrl = "https://zunoqjiwhyzimcayolyu.supabase.co/storage/v1/object/public/transformation-photos/";
    return url.replace(baseUrl, "");
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If we're updating a photo without a new file, just update metadata
    if (currentPhotoToEdit && !selectedFile) {
      try {
        setUploading(true);
        
        // Update existing record metadata
        const { error: updateError } = await supabase
          .from("transformation_photos")
          .update({
            description: description || null,
            photo_date: photoDate.toISOString().split("T")[0],
            privacy_setting: privacySetting
          })
          .eq("id", currentPhotoToEdit.id);
        
        if (updateError) {
          throw new Error(updateError.message);
        }
        
        setUploading(false);
        resetForm();
        router.refresh();
        return;
      } catch (error) {
        console.error("Error updating photo metadata:", error);
        setError(error instanceof Error ? error.message : "Failed to update photo");
        setUploading(false);
      }
      return;
    }
    
    // For new uploads or replacing existing photos
    if (!selectedFile) {
      setError("Please select a photo to upload");
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(10);
      
      // Create a unique file name with original extension
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // Upload file to Supabase Storage
      const { data: storageData, error: uploadError } = await supabase.storage
        .from("transformation-photos")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false
        });
      
      if (uploadError) {
        console.error("Error uploading photo:", uploadError);
        throw new Error(uploadError.message);
      }
      
      setUploadProgress(60);
      
      // Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from("transformation-photos")
        .getPublicUrl(filePath);
      
      setUploadProgress(80);
      
      if (currentPhotoToEdit) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("transformation_photos")
          .update({
            image_url: publicUrlData.publicUrl,
            description: description || null,
            photo_date: photoDate.toISOString().split("T")[0],
            privacy_setting: privacySetting
          })
          .eq("id", currentPhotoToEdit.id);
        
        if (updateError) {
          console.error("Error updating photo record:", updateError);
          throw new Error("Failed to update photo record: " + updateError.message);
        }
        
        // Delete the old file from storage if update was successful
        try {
          const oldFilePath = getStoragePathFromUrl(currentPhotoToEdit.image_url);
          if (oldFilePath) {
            await supabase.storage
              .from("transformation-photos")
              .remove([oldFilePath]);
          }
        } catch (deleteError) {
          console.error("Warning: Failed to delete old photo file:", deleteError);
          // We don't throw here since the update was successful
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from("transformation_photos")
          .insert({
            user_id: userId,
            image_url: publicUrlData.publicUrl,
            photo_type: photoType,
            description: description || null,
            photo_date: photoDate.toISOString().split("T")[0],
            privacy_setting: privacySetting,
            uploaded_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error("Error inserting photo:", insertError);
          throw new Error("Failed to upload photo: " + insertError.message);
        }
      }
      
      setUploadProgress(100);
      
      // Reset form
      resetForm();
      
      // Refresh the page to show the new photo
      router.refresh();
      
    } catch (error) {
      console.error("Error processing photo:", error);
      setError(error instanceof Error ? error.message : "Failed to process photo");
    } finally {
      setUploading(false);
    }
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setPhotoDate(date);
      setShowCalendar(false);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-xl font-medium mb-6">
        {currentPhotoToEdit 
          ? `Edit ${photoType === "before" ? "Before" : "After"} Photo` 
          : `Upload New ${photoType === "before" ? "Before" : "After"} Photo`}
      </h3>
      
      {/* Photo Type Selector */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setPhotoType("before")}
            className={`px-4 py-2 rounded-md ${
              photoType === "before" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Before Photo
          </button>
          <button
            type="button"
            onClick={() => setPhotoType("after")}
            className={`px-4 py-2 rounded-md ${
              photoType === "after" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-600"
            }`}
          >
            After Photo
          </button>
        </div>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column - Form fields */}
          <div className="space-y-4">
            {/* Photo Date */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2">
                Photo Date (when was this photo taken?)
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full p-2 border rounded-md text-left"
              >
                {formatDate(photoDate)}
              </button>
              
              {showCalendar && (
                <div className="absolute z-10 bg-white shadow-lg border rounded-md mt-1">
                  <DayPicker
                    mode="single"
                    selected={photoDate}
                    onSelect={handleDateSelect}
                    defaultMonth={photoDate}
                  />
                </div>
              )}
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Add context or notes for this photo"
              />
            </div>
            
            {/* Privacy Setting */}
            <div>
              <label className="block text-sm font-medium mb-2">Privacy</label>
              <select
                value={privacySetting}
                onChange={(e) => setPrivacySetting(e.target.value as "private" | "public")}
                className="w-full p-2 border rounded-md"
              >
                <option value="private">Private (only you and your trainer)</option>
                <option value="public">Public (can be shared with others)</option>
              </select>
            </div>
          </div>
          
          {/* Right column - Photo upload */}
          <div className="space-y-4">
            {/* Photo preview */}
            <div className="aspect-square w-full bg-gray-100 rounded-md overflow-hidden">
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Photo preview will appear here</p>
                </div>
              )}
            </div>
            
            {/* File input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {currentPhotoToEdit 
                  ? "Select New Photo (optional)" 
                  : "Select Photo"}
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full p-2 border rounded-md"
                disabled={uploading}
              />
              {currentPhotoToEdit && (
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to keep current photo and only update details
                </p>
              )}
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
          </div>
        </div>
        
        {/* Upload progress */}
        {uploading && (
          <div className="w-full">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {currentPhotoToEdit ? "Updating: " : "Uploading: "}{uploadProgress}%
            </p>
          </div>
        )}
        
        {/* Submit button */}
        <button
          type="submit"
          disabled={uploading || (!selectedFile && !currentPhotoToEdit)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-400"
        >
          {uploading 
            ? (currentPhotoToEdit ? "Updating..." : "Uploading...") 
            : (currentPhotoToEdit 
                ? (selectedFile ? "Replace Photo" : "Update Details") 
                : "Upload Photo")}
        </button>
      </form>
    </div>
  );
} 