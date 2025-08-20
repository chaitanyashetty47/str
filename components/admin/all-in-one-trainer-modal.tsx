"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { getAvailableTrainers, assignAllInOneTrainers, type Trainer, type AllInOneTrainerAssignment } from "@/actions/admin/admin.dashboard.action";
import { toast } from "sonner";

interface AllInOneTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerEmail: string;
  clientId: string;
  onTrainerAssigned: () => void;
}

type Step = 1 | 2 | 3 | 4;

export function AllInOneTrainerModal({
  isOpen,
  onClose,
  customerName,
  customerEmail,
  clientId,
  onTrainerAssigned,
}: AllInOneTrainerModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [trainers, setTrainers] = useState<{
    fitness: Trainer[];
    psychology: Trainer[];
    manifestation: Trainer[];
  }>({ fitness: [], psychology: [], manifestation: [] });
  const [selectedTrainers, setSelectedTrainers] = useState<AllInOneTrainerAssignment>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch available trainers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllTrainers();
    }
  }, [isOpen]);

  const fetchAllTrainers = async () => {
    setIsLoading(true);
    try {
      const [fitnessTrainers, psychologyTrainers, manifestationTrainers] = await Promise.all([
        getAvailableTrainers('FITNESS'),
        getAvailableTrainers('PSYCHOLOGY'),
        getAvailableTrainers('MANIFESTATION'),
      ]);

      setTrainers({
        fitness: fitnessTrainers,
        psychology: psychologyTrainers,
        manifestation: manifestationTrainers,
      });
    } catch (error) {
      console.error("Error fetching trainers:", error);
      toast.error("Failed to fetch available trainers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleTrainerSelect = (category: keyof AllInOneTrainerAssignment, trainerId: string) => {
    setSelectedTrainers(prev => ({
      ...prev,
      [category]: trainerId,
    }));
  };

  const handleAssignTrainers = async () => {
    if (!selectedTrainers.fitnessTrainerId || !selectedTrainers.psychologyTrainerId || !selectedTrainers.manifestationTrainerId) {
      toast.error("Please select all three trainers");
      return;
    }

    setIsAssigning(true);
    try {
      const result = await assignAllInOneTrainers(clientId, selectedTrainers);
      
      if (result.success) {
        toast.success(result.message);
        onTrainerAssigned();
        onClose();
        setSelectedTrainers({});
        setCurrentStep(1);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error assigning trainers:", error);
      toast.error("Failed to assign trainers");
    } finally {
      setIsAssigning(false);
    }
  };

  const getStepTitle = (step: Step) => {
    switch (step) {
      case 1:
        return "Assign Fitness Trainer";
      case 2:
        return "Assign Psychology Trainer";
      case 3:
        return "Assign Manifestation Trainer";
      case 4:
        return "Review & Submit";
      default:
        return "";
    }
  };

  const getStepDescription = (step: Step) => {
    switch (step) {
      case 1:
        return "Select a fitness trainer for this client";
      case 2:
        return "Select a psychology trainer for this client";
      case 3:
        return "Select a manifestation trainer for this client";
      case 4:
        return "Review your selections before submitting";
      default:
        return "";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Select 
              value={selectedTrainers.fitnessTrainerId || ""} 
              onValueChange={(value) => handleTrainerSelect('fitnessTrainerId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a fitness trainer..." />
              </SelectTrigger>
              <SelectContent>
                {trainers.fitness.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{trainer.name}</span>
                      <span className="text-xs text-gray-500">Fitness Trainer</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Select 
              value={selectedTrainers.psychologyTrainerId || ""} 
              onValueChange={(value) => handleTrainerSelect('psychologyTrainerId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a psychology trainer..." />
              </SelectTrigger>
              <SelectContent>
                {trainers.psychology.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{trainer.name}</span>
                      <span className="text-xs text-gray-500">Psychology Trainer</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Select 
              value={selectedTrainers.manifestationTrainerId || ""} 
              onValueChange={(value) => handleTrainerSelect('manifestationTrainerId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a manifestation trainer..." />
              </SelectTrigger>
              <SelectContent>
                {trainers.manifestation.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{trainer.name}</span>
                      <span className="text-xs text-gray-500">Manifestation Trainer</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm text-gray-900 mb-2">Selected Trainers</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fitness Trainer:</span>
                  <span className="text-sm font-medium">
                    {trainers.fitness.find(t => t.id === selectedTrainers.fitnessTrainerId)?.name || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Psychology Trainer:</span>
                  <span className="text-sm font-medium">
                    {trainers.psychology.find(t => t.id === selectedTrainers.psychologyTrainerId)?.name || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Manifestation Trainer:</span>
                  <span className="text-sm font-medium">
                    {trainers.manifestation.find(t => t.id === selectedTrainers.manifestationTrainerId)?.name || 'Not selected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedTrainers.fitnessTrainerId;
      case 2:
        return !!selectedTrainers.psychologyTrainerId;
      case 3:
        return !!selectedTrainers.manifestationTrainerId;
      case 4:
        return !!selectedTrainers.fitnessTrainerId && !!selectedTrainers.psychologyTrainerId && !!selectedTrainers.manifestationTrainerId;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assign ALL-IN-ONE Trainers
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900">{customerName}</h4>
            <p className="text-xs text-gray-600">{customerEmail}</p>
            <p className="text-xs text-gray-600 mt-1">
              Plan: <span className="font-medium">All-in-One</span>
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="flex justify-center items-center space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                    step < currentStep
                      ? "bg-green-500 text-white border-green-500"
                      : step === currentStep
                      ? "border-blue-500 text-blue-500"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {step < currentStep ? <Check className="h-4 w-4" /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      step < currentStep ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div>
            <h3 className="text-lg font-semibold mb-2">{getStepTitle(currentStep)}</h3>
            <p className="text-sm text-gray-600 mb-4">{getStepDescription(currentStep)}</p>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-gray-600">Loading trainers...</span>
              </div>
            ) : (
              renderStepContent()
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-2 pt-4">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onClose : handleBack}
              disabled={isAssigning}
            >
              {currentStep === 1 ? (
                "Cancel"
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </>
              )}
            </Button>
            
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isAssigning}
                className="min-w-[100px]"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleAssignTrainers}
                disabled={!canProceed() || isAssigning}
                className="min-w-[100px]"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  "Assign Trainers"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
