"use client";

import { useState, useEffect } from "react";
import { useAction } from "@/hooks/useAction";
import { getProfileDetails, updateProfile } from "@/actions/profile/profile-details.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Lock, LogOut, Trash2, Edit, X, Check } from "lucide-react";

interface ProfileData {
  id: string;
  email: string;
  name: string;
  role: string;
  weight?: number;
  weight_unit?: "KG" | "LB";
  height?: number;
  height_unit?: "CM" | "INCHES" | "FEET";
  date_of_birth?: Date;
  gender?: "MALE" | "FEMALE";
  activity_level?: "SEDENTARY" | "LIGHTLY_ACTIVE" | "MODERATELY_ACTIVE" | "VERY_ACTIVE" | "EXTRA_ACTIVE";
  profile_completed: boolean;
  neck?: number;
  waist?: number;
  hips?: number;
  photo_privacy?: "PRIVATE" | "PUBLIC";
}

export default function ProfileDetails() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [originalData, setOriginalData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { execute: executeUpdate, isLoading: isUpdating } = useAction(updateProfile, {
    onSuccess: (data) => {
      toast.success("Profile updated successfully");
      setHasChanges(false);
      setIsEditing(false);
      // Update original data to reflect saved changes
      setOriginalData(profileData);
    },
    onError: (error) => {
      toast.error(error || "Failed to update profile");
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfileDetails();
        setProfileData(data as ProfileData);
        setOriginalData(data as ProfileData);
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    if (profileData && isEditing) {
      setProfileData(prev => ({ ...prev!, [field]: value }));
      setHasChanges(true);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleSave = () => {
    if (profileData) {
      const updateData = {
        name: profileData.name,
        email: profileData.email,
        date_of_birth: profileData.date_of_birth ? new Date(profileData.date_of_birth).toISOString() : undefined,
        gender: profileData.gender,
        weight: profileData.weight,
        weight_unit: profileData.weight_unit,
        height: profileData.height,
        height_unit: profileData.height_unit,
        neck: profileData.neck,
        waist: profileData.waist,
        hips: profileData.hips,
        activity_level: profileData.activity_level,
        photo_privacy: profileData.photo_privacy,
      };

      executeUpdate(updateData);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    setProfileData(originalData);
    setHasChanges(false);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <p className="text-red-500 text-lg">Failed to load profile data</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Personal Details Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">Personal Details</h2>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {profileData.profile_completed ? 'Complete' : 'Incomplete'}
            </Badge>
          </div>
          
          {!isEditing ? (
            <Button
              onClick={handleEdit}
              variant="outline"
              className="flex items-center space-x-2 px-4 py-2 h-10 rounded-lg border-gray-300 hover:bg-gray-50"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex items-center space-x-2 px-4 py-2 h-10 rounded-lg border-gray-300 hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUpdating || !hasChanges}
                className="flex items-center space-x-2 px-4 py-2 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isUpdating ? 'Saving...' : 'Save'}</span>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
            <Input
              id="name"
              value={profileData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your name"
              disabled={!isEditing}
              className="w-full h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              disabled={!isEditing}
              className="w-full h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dob" className="text-sm font-medium text-gray-700">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={profileData.date_of_birth ? new Date(profileData.date_of_birth).toISOString().split('T')[0] : ''}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              disabled={!isEditing}
              className="w-full h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Gender</Label>
            <Select
              value={profileData.gender || ''}
              onValueChange={(value) => handleInputChange('gender', value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="w-full h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-sm font-medium text-gray-700">Weight</Label>
            <div className="flex space-x-3">
              <Input
                id="weight"
                type="number"
                value={profileData.weight || ''}
                onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                placeholder="Enter weight"
                disabled={!isEditing}
                className="flex-1 h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <Select
                value={profileData.weight_unit || 'KG'}
                onValueChange={(value) => handleInputChange('weight_unit', value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="w-20 h-11 rounded-lg border-gray-300 disabled:bg-gray-50 disabled:text-gray-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KG">KG</SelectItem>
                  <SelectItem value="LB">LB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Height */}
          <div className="space-y-2">
            <Label htmlFor="height" className="text-sm font-medium text-gray-700">Height</Label>
            <div className="flex space-x-3">
              <Input
                id="height"
                type="number"
                value={profileData.height || ''}
                onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
                placeholder="Enter height"
                disabled={!isEditing}
                className="flex-1 h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <Select
                value={profileData.height_unit || 'CM'}
                onValueChange={(value) => handleInputChange('height_unit', value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="w-20 h-11 rounded-lg border-gray-300 disabled:bg-gray-50 disabled:text-gray-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CM">CM</SelectItem>
                  <SelectItem value="INCHES">IN</SelectItem>
                  <SelectItem value="FEET">FT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Neck */}
          <div className="space-y-2">
            <Label htmlFor="neck" className="text-sm font-medium text-gray-700">
              Neck <span className="text-red-500">*</span>
            </Label>
            <div className="flex space-x-3">
              <Input
                id="neck"
                type="number"
                value={profileData.neck || ''}
                onChange={(e) => handleInputChange('neck', parseFloat(e.target.value))}
                placeholder="Required for calculations"
                disabled={!isEditing}
                className="flex-1 h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <div className="w-12 h-11 flex items-center justify-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-300">
                CM
              </div>
            </div>
          </div>

          {/* Waist */}
          <div className="space-y-2">
            <Label htmlFor="waist" className="text-sm font-medium text-gray-700">
              Waist <span className="text-red-500">*</span>
            </Label>
            <div className="flex space-x-3">
              <Input
                id="waist"
                type="number"
                value={profileData.waist || ''}
                onChange={(e) => handleInputChange('waist', parseFloat(e.target.value))}
                placeholder="Required for calculations"
                disabled={!isEditing}
                className="flex-1 h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <div className="w-12 h-11 flex items-center justify-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-300">
                CM
              </div>
            </div>
          </div>

          {/* Hips */}
          <div className="space-y-2">
            <Label htmlFor="hips" className="text-sm font-medium text-gray-700">Hips</Label>
            <div className="flex space-x-3">
              <Input
                id="hips"
                type="number"
                value={profileData.hips || ''}
                onChange={(e) => handleInputChange('hips', parseFloat(e.target.value))}
                placeholder="Enter hip measurement"
                disabled={!isEditing}
                className="flex-1 h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <div className="w-12 h-11 flex items-center justify-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-300">
                CM
              </div>
            </div>
          </div>

          {/* Activity Level */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Activity Level</Label>
            <Select
              value={profileData.activity_level || 'SEDENTARY'}
              onValueChange={(value) => handleInputChange('activity_level', value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="w-full h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEDENTARY">Sedentary</SelectItem>
                <SelectItem value="LIGHTLY_ACTIVE">Lightly Active</SelectItem>
                <SelectItem value="MODERATELY_ACTIVE">Moderately Active</SelectItem>
                <SelectItem value="VERY_ACTIVE">Very Active</SelectItem>
                <SelectItem value="EXTRA_ACTIVE">Extra Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Separator */}
      <Separator className="my-8" />

      {/* Preferences Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
          {/* Weight Unit */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Weight Unit</Label>
            <Select
              value={profileData.weight_unit || 'KG'}
              onValueChange={(value) => handleInputChange('weight_unit', value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="w-full h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KG">KG</SelectItem>
                <SelectItem value="LB">LB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Height Unit */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Height Unit</Label>
            <Select
              value={profileData.height_unit || 'CM'}
              onValueChange={(value) => handleInputChange('height_unit', value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="w-full h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CM">CM</SelectItem>
                <SelectItem value="INCHES">IN</SelectItem>
                <SelectItem value="FEET">FT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Photo Privacy */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Photo Privacy</Label>
            <Select
              value={profileData.photo_privacy || 'PRIVATE'}
              onValueChange={(value) => handleInputChange('photo_privacy', value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="w-full h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Separator */}
      <Separator className="my-8" />

      {/* Account Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Account</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-12 rounded-lg border-gray-300 hover:bg-gray-50 justify-start"
          >
            <Lock className="w-5 h-5 mr-3" />
            Change Password
          </Button>
          
          <Button 
            variant="outline" 
            className="h-12 rounded-lg border-gray-300 hover:bg-gray-50 justify-start"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
          
          <Button 
            variant="destructive" 
            className="h-12 rounded-lg justify-start hover:bg-red-600"
          >
            <Trash2 className="w-5 h-5 mr-3" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}