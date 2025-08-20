"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { SubscriptionCategory } from "@/types/admin-client";

interface Trainer {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AssignCategoryTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientEmail: string;
  category: SubscriptionCategory;
  onTrainerAssigned: () => void;
}

// Helper function to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to get trainer role based on category
function getTrainerRole(category: SubscriptionCategory): string[] {
  switch (category) {
    case "FITNESS":
      return ["FITNESS_TRAINER", "FITNESS_TRAINER_ADMIN"];
    case "PSYCHOLOGY":
      return ["PSYCHOLOGY_TRAINER"];
    case "MANIFESTATION":
      return ["MANIFESTATION_TRAINER"];
    default:
      return [];
  }
}

// Helper function to get category display name
function getCategoryDisplayName(category: SubscriptionCategory): string {
  switch (category) {
    case "FITNESS":
      return "Fitness";
    case "PSYCHOLOGY":
      return "Psychology";
    case "MANIFESTATION":
      return "Manifestation";
    default:
      return category;
  }
}

export function AssignCategoryTrainerModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientEmail,
  category,
  onTrainerAssigned,
}: AssignCategoryTrainerModalProps) {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch trainers for the specific category
  useEffect(() => {
    if (isOpen) {
      fetchTrainers();
    }
  }, [isOpen, category]);

  const fetchTrainers = async () => {
    setIsFetching(true);
    try {
      const trainerRoles = getTrainerRole(category);
      // Use server action instead of API route
      const { getTrainersByRole } = await import('@/actions/admin/admin.client.action');
      const result = await getTrainersByRole({ roles: trainerRoles });
      
      if (result.data) {
        setTrainers(result.data.trainers || []);
      }
    } catch (error) {
      console.error('Failed to fetch trainers:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTrainerId) return;

    setIsLoading(true);
    try {
      // Use server action instead of API route
      const { assignTrainerToClient } = await import('@/actions/admin/admin.client.action');
      
      // Only pass valid categories for assignment (not ALL_IN_ONE)
      if (category === "ALL_IN_ONE") {
        console.error('Cannot assign individual trainer for ALL_IN_ONE category');
        setIsLoading(false);
        return;
      }
      
      console.log('Assigning trainer:', { clientId, trainerId: selectedTrainerId, category });
      
      const result = await assignTrainerToClient({
        clientId,
        trainerId: selectedTrainerId,
        category: category as "FITNESS" | "PSYCHOLOGY" | "MANIFESTATION",
      });

      console.log('Assignment result:', result);

      if (result.data) {
        console.log('Assignment successful, refreshing data...');
        // Call onTrainerAssigned first to refresh the data
        onTrainerAssigned();
        // Then close the modal and reset
        setSelectedTrainerId("");
      } else if (result.error) {
        console.error('Failed to assign trainer:', result.error);
        alert(`Failed to assign trainer: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to assign trainer:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedTrainerId("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign {getCategoryDisplayName(category)} Trainer</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Client Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gray-200 text-gray-600">
                {getInitials(clientName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{clientName}</p>
              <p className="text-sm text-muted-foreground">{clientEmail}</p>
            </div>
          </div>

          {/* Trainer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select {getCategoryDisplayName(category)} Trainer
            </label>
            <Select value={selectedTrainerId} onValueChange={setSelectedTrainerId}>
              <SelectTrigger>
                <SelectValue placeholder={`Choose a ${getCategoryDisplayName(category).toLowerCase()} trainer`} />
              </SelectTrigger>
              <SelectContent>
                {isFetching ? (
                  <SelectItem value="loading" disabled>Loading trainers...</SelectItem>
                ) : trainers.length === 0 ? (
                  <SelectItem value="no-trainers" disabled>No trainers available</SelectItem>
                ) : (
                  trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{trainer.name}</div>
                          <div className="text-xs text-muted-foreground">{trainer.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedTrainerId || isLoading}
            >
              {isLoading ? "Assigning..." : "Assign Trainer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
