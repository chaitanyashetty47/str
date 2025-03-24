"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface ProfileFitnessInfoProps {
  user: User;
  profile: any; // Using any for now, ideally we'd have a proper type
}

export default function ProfileFitnessInfo({ user, profile }: ProfileFitnessInfoProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [weight, setWeight] = useState<string>(profile?.weight?.toString() || "");
  const [bodyFatPercentage, setBodyFatPercentage] = useState<string>(
    profile?.body_fat_percentage?.toString() || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Convert inputs to numbers or null
      const weightValue = weight ? parseFloat(weight) : null;
      const bodyFatValue = bodyFatPercentage ? parseFloat(bodyFatPercentage) : null;
      
      // Check if profile exists
      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update({
            weight: weightValue,
            body_fat_percentage: bodyFatValue,
      
          })
          .eq("user_id", user.id);
          
        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            weight: weightValue,
            body_fat_percentage: bodyFatValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (error) throw error;
      }
      
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error("Error updating fitness info:", err);
      setError(typeof err === "object" && err !== null && "message" in err 
        ? String(err.message) 
        : "Failed to update fitness information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Fitness Information</h3>
          {!isEditing ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsEditing(false);
                  setWeight(profile?.weight?.toString() || "");
                  setBodyFatPercentage(profile?.body_fat_percentage?.toString() || "");
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            {isEditing ? (
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter your weight in kg"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {profile?.weight ? `${profile.weight} kg` : "Not set"}
              </div>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="bodyFat">Body Fat Percentage (%)</Label>
            {isEditing ? (
              <Input
                id="bodyFat"
                type="number"
                step="0.1"
                value={bodyFatPercentage}
                onChange={(e) => setBodyFatPercentage(e.target.value)}
                placeholder="Enter your body fat percentage"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {profile?.body_fat_percentage ? `${profile.body_fat_percentage}%` : "Not set"}
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="text-sm text-destructive mt-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 