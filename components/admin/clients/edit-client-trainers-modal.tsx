"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, X } from "lucide-react";
import { AdminClient, SubscriptionCategory } from "@/types/admin-client";

interface Trainer {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EditClientTrainersModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: AdminClient | null;
  onTrainersUpdated: () => void;
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

// Helper function to check if client needs trainer for category
function clientNeedsCategory(client: AdminClient, category: SubscriptionCategory): boolean {
  return client.activePlans.some(plan => 
    plan.category === category || plan.category === 'ALL_IN_ONE'
  );
}

export function EditClientTrainersModal({
  isOpen,
  onClose,
  client,
  onTrainersUpdated,
}: EditClientTrainersModalProps) {
  const [trainers, setTrainers] = useState<Record<SubscriptionCategory, Trainer[]>>({
    FITNESS: [],
    PSYCHOLOGY: [],
    MANIFESTATION: [],
    ALL_IN_ONE: [],
  });
  
  const [selectedTrainers, setSelectedTrainers] = useState<Record<SubscriptionCategory, string>>({
    FITNESS: "",
    PSYCHOLOGY: "",
    MANIFESTATION: "",
    ALL_IN_ONE: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Initialize selected trainers when client changes
  useEffect(() => {
    if (client) {
      setSelectedTrainers({
        FITNESS: client.trainerAssignments.fitness?.trainerId || "",
        PSYCHOLOGY: client.trainerAssignments.psychology?.trainerId || "",
        MANIFESTATION: client.trainerAssignments.manifestation?.trainerId || "",
        ALL_IN_ONE: "",
      });
    }
  }, [client]);

  // Fetch trainers for all categories
  useEffect(() => {
    if (isOpen && client) {
      fetchAllTrainers();
    }
  }, [isOpen, client]);

  const fetchAllTrainers = async () => {
    setIsFetching(true);
    try {
      const categories: SubscriptionCategory[] = ['FITNESS', 'PSYCHOLOGY', 'MANIFESTATION'];
      const trainerData: Record<SubscriptionCategory, Trainer[]> = {
        FITNESS: [],
        PSYCHOLOGY: [],
        MANIFESTATION: [],
        ALL_IN_ONE: [],
      };

      for (const category of categories) {
        const trainerRoles = getTrainerRole(category);
        // Use server action instead of API route
        const { getTrainersByRole } = await import('@/actions/admin/admin.client.action');
        const result = await getTrainersByRole({ roles: trainerRoles });
        
        if (result.data) {
          trainerData[category] = result.data.trainers || [];
        }
      }

      setTrainers(trainerData);
    } catch (error) {
      console.error('Failed to fetch trainers:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleTrainerChange = (category: SubscriptionCategory, trainerId: string) => {
    // Convert "no-trainer" to empty string
    const actualTrainerId = trainerId === "no-trainer" ? "" : trainerId;
    setSelectedTrainers(prev => ({
      ...prev,
      [category]: actualTrainerId,
    }));
  };

  const handleRemoveTrainer = (category: SubscriptionCategory) => {
    setSelectedTrainers(prev => ({
      ...prev,
      [category]: "",
    }));
  };

  const handleSave = async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      // This would be a server action to update trainer assignments
      const updates = [];
      
      const categories: SubscriptionCategory[] = ['FITNESS', 'PSYCHOLOGY', 'MANIFESTATION'];
      
      for (const category of categories) {
        if (clientNeedsCategory(client, category)) {
          const currentTrainerId = getCurrentTrainerId(category);
          const newTrainerId = selectedTrainers[category];
          
          if (currentTrainerId !== newTrainerId) {
            updates.push({
              category,
              oldTrainerId: currentTrainerId,
              newTrainerId,
            });
          }
        }
      }

      if (updates.length > 0) {
        // Use server action instead of API route
        const { updateTrainerAssignments } = await import('@/actions/admin/admin.client.action');
        const result = await updateTrainerAssignments({
          clientId: client.id,
          updates,
        });

        if (result.data) {
          onTrainersUpdated();
          onClose();
        } else if (result.error) {
          console.error('Failed to update trainer assignments:', result.error);
        }
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Failed to update trainer assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentTrainerId = (category: SubscriptionCategory): string => {
    switch (category) {
      case 'FITNESS':
        return client?.trainerAssignments.fitness?.trainerId || "";
      case 'PSYCHOLOGY':
        return client?.trainerAssignments.psychology?.trainerId || "";
      case 'MANIFESTATION':
        return client?.trainerAssignments.manifestation?.trainerId || "";
      default:
        return "";
    }
  };

  const renderTrainerSelection = (category: SubscriptionCategory, label: string) => {
    if (!client || !clientNeedsCategory(client, category)) {
      return null;
    }

    const currentTrainer = getCurrentTrainerId(category);
    const selectedTrainerId = selectedTrainers[category];
    const categoryTrainers = trainers[category];
    
    // Convert empty string to "no-trainer" for display
    const displayValue = selectedTrainerId || "no-trainer";

    return (
      <div key={category} className="space-y-2">
        <label className="text-sm font-medium">{label} Trainer</label>
        <div className="flex gap-2">
          <Select 
            value={displayValue} 
            onValueChange={(value) => handleTrainerChange(category, value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={`Choose a ${label.toLowerCase()} trainer`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-trainer">No trainer assigned</SelectItem>
              {isFetching ? (
                <SelectItem value="loading" disabled>Loading trainers...</SelectItem>
              ) : categoryTrainers.length === 0 ? (
                <SelectItem value="no-trainers-available" disabled>No trainers available</SelectItem>
              ) : (
                categoryTrainers.map((trainer) => (
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
          {selectedTrainerId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveTrainer(category)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Trainer Assignments</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Client Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gray-200 text-gray-600">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{client.name}</p>
              <p className="text-sm text-muted-foreground">{client.email}</p>
            </div>
          </div>

          {/* Active Plans */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Active Plans</label>
            <div className="flex flex-wrap gap-2">
              {client.activePlans.map((plan) => (
                <span 
                  key={plan.id}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                >
                  {plan.name}
                </span>
              ))}
            </div>
          </div>

          {/* Trainer Assignments */}
          <div className="space-y-4">
            {renderTrainerSelection('FITNESS', 'Fitness')}
            {renderTrainerSelection('PSYCHOLOGY', 'Psychology')}
            {renderTrainerSelection('MANIFESTATION', 'Manifestation')}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
