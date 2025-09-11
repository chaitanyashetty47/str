"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller } from "react-hook-form";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import { PhoneInput, type CountryData } from "@/components/ui/phone-input";
import { CircleFlag } from "react-circle-flags";
import { countries } from "country-data-list";
import { countryEnumToAlpha3 } from '@/utils/country-mapping';
import { getProfileDetails, updateProfile } from "@/actions/profile/get-profile-details.action";
import { useAction } from "@/hooks/useAction";
import { toast } from "sonner";

// Helper function to convert inches to cm
function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

// Helper function to get country info from alpha3 code
function getCountryInfo(countryCode: string) {
  if (!countryCode) return null;
  try {
    const countryArray = countries[countryCode as keyof typeof countries];
    return countryArray?.[0] || null;
  } catch {
    return null;
  }
}

// Helper function to format phone number with flag
function formatPhoneNumber(phone: string, countryAlpha3: string) {
  const countryInfo = getCountryInfo(countryAlpha3);
  return {
    phone,
    countryInfo,
    alpha2: countryInfo?.alpha2?.toLowerCase()
  };
}

// Helper function to get measurement validation
function getMeasurementValidation(value: number, fieldName: string) {
  if (!value || value <= 0) return null;
  
  const ranges = {
    neck: { min: 25, max: 60, name: "Neck" },
    waist: { min: 50, max: 150, name: "Waist" },
    hips: { min: 70, max: 150, name: "Hips" },
  };
  
  const range = ranges[fieldName as keyof typeof ranges];
  if (!range) return null;
  
  if (value < range.min) {
    const inchesValue = Math.round(value / 2.54 * 10) / 10;
    return {
      type: "error" as const,
      message: `${range.name} measurement seems too small (${value}cm). Did you mean ${inchesValue} inches? That would be ${inchesToCm(inchesValue)}cm.`,
      suggestion: `Try ${inchesToCm(inchesValue)}cm instead.`
    };
  }
  
  // Warning thresholds based on new realistic ranges
  if (value < range.min + 10) {
    return {
      type: "warning" as const,
      message: `${range.name} measurement seems small (${value}cm). Please double-check. You can proceed with it.`,
      suggestion: null
    };
  }
  
  if (value > range.max) {
    return {
      type: "error" as const,
      message: `${range.name} measurement seems too large (${value}cm). Please check your measurement.`,
      suggestion: null
    };
  }
  
  return {
    type: "success" as const,
    message: `${range.name} measurement looks good!`,
    suggestion: null
  };
}

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
    country: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    activity_level: "",
    weight: "",
    height: "",
    neck: "",
    waist: "",
    hips: ""
  });
  
  // Validation state for measurements
  const [validationMessages, setValidationMessages] = useState<{
    [key: string]: { type: 'error' | 'warning' | 'success'; message: string; suggestion: string | null } | null;
  }>({});

  // Country and phone synchronization state
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [countryDropdownData, setCountryDropdownData] = useState<any>(null);

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
      country: profileData.country || "",
      phone: profileData.phone || "",
      date_of_birth: profileData.date_of_birth ? 
        new Date(profileData.date_of_birth).toISOString().split('T')[0] : "",
      gender: profileData.gender || "",
      activity_level: profileData.activity_level || "",
      weight: profileData.weight?.toString() || "",
      height: profileData.height?.toString() || "",
      neck: profileData.neck?.toString() || "",
      waist: profileData.waist?.toString() || "",
      hips: profileData.hips?.toString() || ""
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

  // Initialize selectedCountry state when profile data is available
  useEffect(() => {
    if (profile?.country) {
      // Convert enum to alpha3 if needed
      const alpha3Code = countryEnumToAlpha3(profile.country) || profile.country;
      const countryInfo = getCountryInfo(alpha3Code);
      
      if (countryInfo) {
        setSelectedCountry({
          alpha2: countryInfo.alpha2,
          alpha3: alpha3Code,
          name: countryInfo.name,
          countryCallingCodes: countryInfo.countryCallingCodes
        });
      }
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate measurements in real-time
    if (['neck', 'waist', 'hips'].includes(field)) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const validation = getMeasurementValidation(numValue, field);
        setValidationMessages(prev => ({
          ...prev,
          [field]: validation
        }));
      } else {
        setValidationMessages(prev => ({
          ...prev,
          [field]: null
        }));
      }
    }
  };

  const handleSave = async () => {
    await executeUpdate({
      name: formData.name,
      email: formData.email,
      country: formData.country || undefined,
      phone: formData.phone || undefined,
      date_of_birth: formData.date_of_birth || undefined,
      gender: formData.gender as "MALE" | "FEMALE" | undefined,
      activity_level: formData.activity_level as any,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      neck: formData.neck ? parseFloat(formData.neck) : undefined,
      waist: formData.waist ? parseFloat(formData.waist) : undefined,
      hips: formData.hips ? parseFloat(formData.hips) : undefined
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
        {/* Row 1: Email (readonly), Name, Country, Phone */}
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

        {/* Row 1.5: Country and Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            {isEditing ? (
              <CountryDropdown
                defaultValue={(() => {
                  // Convert enum to alpha3 if needed
                  return countryEnumToAlpha3(formData.country) || formData.country;
                })()}
                onChange={(country) => {
                  handleInputChange("country", country.alpha3);
                  setCountryDropdownData(country); // Store full country object
                  const countryData = {
                    alpha2: country.alpha2,
                    alpha3: country.alpha3,
                    name: country.name,
                    countryCallingCodes: country.countryCallingCodes
                  };
                  setSelectedCountry(countryData);
                  if (country.countryCallingCodes?.[0]) {
                    handleInputChange("phone", country.countryCallingCodes[0]);
                  }
                }}
                placeholder="Select your country"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.country ? (
                  (() => {
                    // Convert enum to alpha3 if needed
                    const alpha3Code = countryEnumToAlpha3(formData.country) || formData.country;
                    const countryInfo = getCountryInfo(alpha3Code);
                    
                    if (countryInfo) {
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                            <CircleFlag
                              countryCode={countryInfo.alpha2.toLowerCase()}
                              height={16}
                              width={16}
                            />
                          </div>
                          <span>{countryInfo.name}</span>
                        </div>
                      );
                    }
                    return formData.country;
                  })()
                ) : "Not set"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            {isEditing ? (
              <PhoneInput
                value={formData.phone || ''}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                defaultCountry={selectedCountry?.alpha2?.toLowerCase()}
                onCountryChange={(countryData) => {
                  if (countryData && countryData.alpha3 !== selectedCountry?.alpha3) {
                    setSelectedCountry(countryData);
                    handleInputChange("country", countryData.alpha3);
                  }
                }}
                placeholder="Enter your phone number"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.phone ? (
                  (() => {
                    // Convert enum to alpha3 if needed
                    const alpha3Code = countryEnumToAlpha3(formData.country) || formData.country;
                    const phoneData = formatPhoneNumber(formData.phone, alpha3Code);
                    
                    if (phoneData.countryInfo && phoneData.alpha2) {
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                            <CircleFlag
                              countryCode={phoneData.alpha2}
                              height={16}
                              width={16}
                            />
                          </div>
                          <span>{phoneData.phone}</span>
                        </div>
                      );
                    }
                    return formData.phone;
                  })()
                ) : "Not set"}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Optional - for contact purposes
            </p>
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

        {/* Row 3: Weight (kg), Height (cm) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
              {isEditing ? (
                  <Input
                id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                placeholder="Enter weight in kilograms"
                className="w-full"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.weight ? `${formData.weight} kg` : "Not set"}
                </div>
              )}
            <p className="text-xs text-gray-500">
              Enter your weight in kilograms
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
              {isEditing ? (
                  <Input
                id="height"
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => handleInputChange("height", e.target.value)}
                placeholder="Enter height in centimeters"
                className="w-full"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.height ? `${formData.height} cm` : "Not set"}
                </div>
              )}
            <p className="text-xs text-gray-500">
              Enter your height in centimeters
            </p>
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
                className={validationMessages.neck?.type === 'error' ? 'border-red-500' : validationMessages.neck?.type === 'warning' ? 'border-yellow-500' : validationMessages.neck?.type === 'success' ? 'border-green-500' : ''}
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.neck ? `${formData.neck} cm` : "Not set"}
              </div>
            )}
            {validationMessages.neck && (
              <div className={`text-sm p-2 rounded-md ${
                validationMessages.neck?.type === 'error' ? 'text-red-700 bg-red-50 border border-red-200' :
                validationMessages.neck?.type === 'warning' ? 'text-yellow-700 bg-yellow-50 border border-yellow-200' :
                'text-green-700 bg-green-50 border border-green-200'
              }`}>
                <p>{validationMessages.neck.message}</p>
                {validationMessages.neck.suggestion && (
                  <p className="font-medium mt-1">{validationMessages.neck.suggestion}</p>
                )}
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
                className={validationMessages.waist?.type === 'error' ? 'border-red-500' : validationMessages.waist?.type === 'warning' ? 'border-yellow-500' : validationMessages.waist?.type === 'success' ? 'border-green-500' : ''}
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.waist ? `${formData.waist} cm` : "Not set"}
              </div>
            )}
            {validationMessages.waist && (
              <div className={`text-sm p-2 rounded-md ${
                validationMessages.waist?.type === 'error' ? 'text-red-700 bg-red-50 border border-red-200' :
                validationMessages.waist?.type === 'warning' ? 'text-yellow-700 bg-yellow-50 border border-yellow-200' :
                'text-green-700 bg-green-50 border border-green-200'
              }`}>
                <p>{validationMessages.waist.message}</p>
                {validationMessages.waist.suggestion && (
                  <p className="font-medium mt-1">{validationMessages.waist.suggestion}</p>
                )}
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
                className={validationMessages.hips?.type === 'error' ? 'border-red-500' : validationMessages.hips?.type === 'warning' ? 'border-yellow-500' : validationMessages.hips?.type === 'success' ? 'border-green-500' : ''}
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {formData.hips ? `${formData.hips} cm` : "Not set"}
              </div>
            )}
            {validationMessages.hips && (
              <div className={`text-sm p-2 rounded-md ${
                validationMessages.hips?.type === 'error' ? 'text-red-700 bg-red-50 border border-red-200' :
                validationMessages.hips?.type === 'warning' ? 'text-yellow-700 bg-yellow-50 border border-yellow-200' :
                'text-green-700 bg-green-50 border border-green-200'
              }`}>
                <p>{validationMessages.hips.message}</p>
                {validationMessages.hips.suggestion && (
                  <p className="font-medium mt-1">{validationMessages.hips.suggestion}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 5: End of form */}
      </div>
    </div>
  );
}