"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface ProfileGeneralInfoProps {
  user: User;
}

export default function ProfileGeneralInfo({ user }: ProfileGeneralInfoProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.user_metadata?.full_name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name }
      });
      
      if (error) {
        throw error;
      }
      
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(typeof err === "object" && err !== null && "message" in err 
        ? String(err.message) 
        : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Personal Information</h3>
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
                  setName(user.user_metadata?.full_name || "");
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
            <Label htmlFor="name">Name</Label>
            {isEditing ? (
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/50">
                {user.user_metadata?.full_name || "Not set"}
              </div>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="p-2 border rounded-md bg-muted/50">
              {user.email}
            </div>
            <p className="text-xs text-muted-foreground">
              Your email cannot be changed
            </p>
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