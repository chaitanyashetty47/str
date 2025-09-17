"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateAdminProfile } from "@/actions/profile/admin/update-admin-profile.action";
import { getAdminProfileDetails } from "@/actions/profile/admin/get-admin-profile-details.action";
import { useAction } from "@/hooks/useAction";
import { toast } from "sonner";

interface AdminProfileFormProps {
  user: User;
  initialData?: any; // Optional pre-loaded profile data
  onDataUpdate?: () => void; // Callback to refresh parent data
}

export function AdminProfileForm({ user, initialData, onDataUpdate }: AdminProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  // Use the useAction hook for updating profile
  const { execute: executeUpdate, isLoading, fieldErrors, error } = useAction(updateAdminProfile, {
    onSuccess: (data) => {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      // Update the local profile state with the new data
      if (data.profile) {
        setProfile(data.profile);
      }
      // Notify parent to refresh data
      onDataUpdate?.();
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  // Function to set form data from profile data
  const setFormDataFromProfile = (profileData: any) => {
    setFormData({
      name: profileData.name || "",
      email: profileData.email || "",
    });
  };

  useEffect(() => {
    // If initialData is provided, use it instead of fetching
    if (initialData) {
      setProfile(initialData);
      setFormDataFromProfile(initialData);
      setIsLoadingProfile(false);
      return;
    }

    // Otherwise, fetch profile data
    const fetchProfile = async () => {
      try {
        const profileData = await getAdminProfileDetails();
        setProfile(profileData);
        setFormDataFromProfile(profileData);
      } catch (error) {
        console.error("Error fetching admin profile:", error);
        toast.error("Failed to load admin profile data");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [initialData]); // Depend on initialData

  // Update form data when initialData changes (parent refresh)
  useEffect(() => {
    if (initialData && !isEditing) {
      setProfile(initialData);
      setFormDataFromProfile(initialData);
    }
  }, [initialData, isEditing]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await executeUpdate({
      name: formData.name,
      email: formData.email,
    });
  };

  const handleCancel = () => {
    if (profile) {
      setFormDataFromProfile(profile);
    }
    setIsEditing(false);
  };

  if (isLoadingProfile) {
    return <div className="flex justify-center p-8">Loading admin profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Admin Profile Information</h3>
        {!isEditing ? (
          <Button 
            variant="outline"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Display general error */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Display field errors */}
      {fieldErrors && Object.keys(fieldErrors).length > 0 && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <p className="font-medium mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(fieldErrors).map(([field, errors]) => 
              errors?.map((error, index) => (
                <li key={`${field}-${index}`}>{error}</li>
              ))
            )}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        {/* Row 1: Email (readonly) and Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="p-2 border rounded-md bg-muted/50">
              {formData.email}
            </div>
            <p className="text-xs text-muted-foreground">
              Your email cannot be changed
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Your full name"
                required
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.name || "Not set"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}