"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfileDetails, updateProfile } from "@/actions/profile/profile-details.action";
import { useAction } from "@/hooks/useAction";
import { toast } from "sonner";

interface ProfileFormProps {
  user: User;
  initialData?: any; // Optional pre-loaded profile data
  onDataUpdate?: () => void; // Callback to refresh parent data
}

export function ProfileForm({ user, initialData, onDataUpdate }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date_of_birth: "",
    gender: "",
    activity_level: "",
    weight: "",
    weight_unit: "KG",
    height: "",
    height_unit: "CM",
    neck: "",
    waist: "",
    hips: "",
    photo_privacy: "PRIVATE"
  });

  // Use the useAction hook for updating profile
  const { execute: executeUpdate, isLoading, fieldErrors, error } = useAction(updateProfile, {
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
      date_of_birth: profileData.date_of_birth ? 
        new Date(profileData.date_of_birth).toISOString().split('T')[0] : "",
      gender: profileData.gender || "",
      activity_level: profileData.activity_level || "",
      weight: profileData.weight?.toString() || "",
      weight_unit: profileData.weight_unit || "KG",
      height: profileData.height?.toString() || "",
      height_unit: profileData.height_unit || "CM",
      neck: profileData.neck?.toString() || "",
      waist: profileData.waist?.toString() || "",
      hips: profileData.hips?.toString() || "",
      photo_privacy: profileData.photo_privacy || "PRIVATE"
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

    // Otherwise, fetch profile data as before
    const fetchProfile = async () => {
      try {
        const profileData = await getProfileDetails();
        setProfile(profileData);
        setFormDataFromProfile(profileData);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
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
      date_of_birth: formData.date_of_birth || undefined,
      gender: formData.gender as "MALE" | "FEMALE" | undefined,
      activity_level: formData.activity_level as any,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      weight_unit: formData.weight_unit as "KG" | "LB",
      height: formData.height ? parseFloat(formData.height) : undefined,
      height_unit: formData.height_unit as "CM" | "INCHES" | "FEET",
      neck: formData.neck ? parseFloat(formData.neck) : undefined,
      waist: formData.waist ? parseFloat(formData.waist) : undefined,
      hips: formData.hips ? parseFloat(formData.hips) : undefined,
      photo_privacy: formData.photo_privacy as "PRIVATE" | "PUBLIC"
    });
  };

  const handleCancel = () => {
    if (profile) {
      setFormDataFromProfile(profile);
    }
    setIsEditing(false);
  };

  if (isLoadingProfile) {
    return <div className="flex justify-center p-8">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Profile Information</h3>
        {!isEditing ? (
          <Button 
            variant="outline" 
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

        {/* Row 2: Date of Birth, Gender, Activity Level */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            {isEditing ? (
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.date_of_birth ? 
                  new Date(formData.date_of_birth).toLocaleDateString() : "Not set"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            {isEditing ? (
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.gender ? 
                  formData.gender.charAt(0) + formData.gender.slice(1).toLowerCase() : "Not set"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity_level">Activity Level</Label>
            {isEditing ? (
              <Select value={formData.activity_level} onValueChange={(value) => handleInputChange("activity_level", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEDENTARY">Sedentary</SelectItem>
                  <SelectItem value="LIGHTLY_ACTIVE">Lightly Active</SelectItem>
                  <SelectItem value="MODERATELY_ACTIVE">Moderately Active</SelectItem>
                  <SelectItem value="VERY_ACTIVE">Very Active</SelectItem>
                  <SelectItem value="EXTRA_ACTIVE">Extra Active</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.activity_level ? 
                  formData.activity_level.split('_').map(word => 
                    word.charAt(0) + word.slice(1).toLowerCase()
                  ).join(' ') : "Not set"}
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Weight + Weight Unit, Height + Height Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Weight</Label>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                    placeholder="Enter weight"
                    className="flex-1"
                  />
                  <Select value={formData.weight_unit} onValueChange={(value) => handleInputChange("weight_unit", value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG">KG</SelectItem>
                      <SelectItem value="LB">LB</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <div className="p-2 border rounded-md bg-muted/50 w-full">
                  {formData.weight ? `${formData.weight} ${formData.weight_unit}` : "Not set"}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Height</Label>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => handleInputChange("height", e.target.value)}
                    placeholder="Enter height"
                    className="flex-1"
                  />
                  <Select value={formData.height_unit} onValueChange={(value) => handleInputChange("height_unit", value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CM">CM</SelectItem>
                      <SelectItem value="INCHES">IN</SelectItem>
                      <SelectItem value="FEET">FT</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <div className="p-2 border rounded-md bg-muted/50 w-full">
                  {formData.height ? `${formData.height} ${formData.height_unit}` : "Not set"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 4: Neck, Waist, Hips (in cm) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="neck">Neck (cm)</Label>
            {isEditing ? (
              <Input
                id="neck"
                type="number"
                step="0.1"
                value={formData.neck}
                onChange={(e) => handleInputChange("neck", e.target.value)}
                placeholder="Enter neck measurement"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.neck ? `${formData.neck} cm` : "Not set"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="waist">Waist (cm)</Label>
            {isEditing ? (
              <Input
                id="waist"
                type="number"
                step="0.1"
                value={formData.waist}
                onChange={(e) => handleInputChange("waist", e.target.value)}
                placeholder="Enter waist measurement"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.waist ? `${formData.waist} cm` : "Not set"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hips">Hips (cm)</Label>
            {isEditing ? (
              <Input
                id="hips"
                type="number"
                step="0.1"
                value={formData.hips}
                onChange={(e) => handleInputChange("hips", e.target.value)}
                placeholder="Enter hip measurement"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.hips ? `${formData.hips} cm` : "Not set"}
              </div>
            )}
          </div>
        </div>

        {/* Row 5: Photo Privacy Settings */}
        <div className="space-y-2">
          <Label htmlFor="photo_privacy">Photo Privacy Settings</Label>
          {isEditing ? (
            <Select value={formData.photo_privacy} onValueChange={(value) => handleInputChange("photo_privacy", value)}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select privacy setting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Private (Only you can see)</SelectItem>
                <SelectItem value="PUBLIC">Public (Visible to others)</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="p-2 border rounded-md bg-muted/50 w-full md:w-64">
              {formData.photo_privacy === "PRIVATE" ? "Private (Only you can see)" : "Public (Visible to others)"}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Control who can see your transformation photos
          </p>
        </div>
      </div>
    </div>
  );
}