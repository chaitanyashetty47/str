"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User } from "lucide-react";
import { getAvailableTrainers, assignTrainerToClient, type Trainer } from "@/actions/admin/admin.dashboard.action";
import { toast } from "sonner";

interface AssignTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerEmail: string;
  planCategory: string;
  clientId: string;
  onTrainerAssigned: () => void;
}

export function AssignTrainerModal({
  isOpen,
  onClose,
  customerName,
  customerEmail,
  planCategory,
  clientId,
  onTrainerAssigned,
}: AssignTrainerModalProps) {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch available trainers when modal opens
  useEffect(() => {
    if (isOpen && planCategory) {
      fetchTrainers();
    }
  }, [isOpen, planCategory]);

  const fetchTrainers = async () => {
    setIsLoading(true);
    try {
      const availableTrainers = await getAvailableTrainers(planCategory);
      setTrainers(availableTrainers);
    } catch (error) {
      console.error("Error fetching trainers:", error);
      toast.error("Failed to fetch available trainers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTrainer = async () => {
    if (!selectedTrainerId) {
      toast.error("Please select a trainer");
      return;
    }

    setIsAssigning(true);
    try {
      const result = await assignTrainerToClient(clientId, selectedTrainerId, planCategory as 'FITNESS' | 'PSYCHOLOGY' | 'MANIFESTATION');
      
      if (result.success) {
        toast.success(result.message);
        onTrainerAssigned();
        onClose();
        setSelectedTrainerId("");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error assigning trainer:", error);
      toast.error("Failed to assign trainer");
    } finally {
      setIsAssigning(false);
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'FITNESS':
        return 'Fitness';
      case 'PSYCHOLOGY':
        return 'Psychology';
      case 'MANIFESTATION':
        return 'Manifestation';
      case 'ALL_IN_ONE':
        return 'All-in-One';
      default:
        return category;
    }
  };

  const getTrainerRoleDisplayName = (role: string) => {
    switch (role) {
      case 'FITNESS_TRAINER':
        return 'Fitness Trainer';
      case 'PSYCHOLOGY_TRAINER':
        return 'Psychology Trainer';
      case 'MANIFESTATION_TRAINER':
        return 'Manifestation Trainer';
      default:
        return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assign Trainer
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Customer Information */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900">{customerName}</h4>
            <p className="text-xs text-gray-600">{customerEmail}</p>
            <p className="text-xs text-gray-600 mt-1">
              Plan: <span className="font-medium">{getCategoryDisplayName(planCategory)}</span>
            </p>
          </div>

          {/* Trainer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Trainer</label>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-gray-600">Loading trainers...</span>
              </div>
            ) : trainers.length === 0 ? (
              <div className="text-center p-4 text-sm text-gray-500">
                No trainers available for this plan category.
              </div>
            ) : (
              <Select value={selectedTrainerId} onValueChange={setSelectedTrainerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a trainer..." />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{trainer.name}</span>
                        <span className="text-xs text-gray-500">
                          {getTrainerRoleDisplayName(trainer.role)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isAssigning}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignTrainer} 
              disabled={!selectedTrainerId || isAssigning}
              className="min-w-[100px]"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Assigning...
                </>
              ) : (
                "Assign Trainer"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
