import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import TransformationGallery from "./components/TransformationGallery";
import UploadPhotoSection from "./components/UploadPhotoSection";

export const metadata: Metadata = {
  title: "Transformation Photos | Strentor",
  description: "View and upload your transformation photos to track your progress over time.",
};

export default async function PhotosPage() {
  const supabase = await createClient();
  
  // Get the current user session
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  // Fetch user's transformation photos
  const { data: photos, error } = await supabase
    .from("transformation_photos")
    .select("*")
    .eq("user_id", user.id)
    .order("photo_date", { ascending: false });
  
  if (error) {
    console.error("Error fetching photos:", error);
  }
  
  // Separate before and after photos
  const beforePhotos = photos?.filter(photo => photo.photo_type === "before") || [];
  const afterPhotos = photos?.filter(photo => photo.photo_type === "after") || [];
  
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <h1 className="text-3xl font-bold mb-8">Transformation Photos</h1>
      
      <div className="grid gap-10">
        {/* Before/After Comparison Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Before & After</h2>
          <TransformationGallery 
            beforePhotos={beforePhotos} 
            afterPhotos={afterPhotos} 
          />
        </section>
        
        {/* Upload Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Upload New Photo</h2>
          <UploadPhotoSection userId={user.id} />
        </section>
      </div>
    </div>
  );
}
