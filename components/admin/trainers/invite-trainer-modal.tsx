"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mail, User, UserPlus } from "lucide-react";
import { inviteTrainer } from "@/actions/admin/invite-trainer.action";
import { toast } from "sonner";

interface InviteTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrainerInvited: () => void;
}

export function InviteTrainerModal({
  isOpen,
  onClose,
  onTrainerInvited,
}: InviteTrainerModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleInputEvent = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent event bubbling
    handleInputChange(field, e.target.value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await inviteTrainer({
        email: formData.email.trim(),
        name: formData.name.trim(),
        role: formData.role as any,
      });

      if (result.data) {
        toast.success(`Invitation sent successfully to ${formData.email}!`);
        onTrainerInvited();
        handleClose();
      } else if (result.error) {
        toast.error(`Failed to send invitation: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to invite trainer:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ email: "", name: "", role: "" });
    setErrors({});
    onClose();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "FITNESS_TRAINER":
        return "Fitness Trainer";
      case "FITNESS_TRAINER_ADMIN":
        return "Fitness Trainer Admin";
      case "PSYCHOLOGY_TRAINER":
        return "Psychology Trainer";
      case "MANIFESTATION_TRAINER":
        return "Manifestation Trainer";
      default:
        return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite New Trainer
          </DialogTitle>
        </DialogHeader>
        
        <form 
          className="space-y-4" 
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => e.preventDefault()}
          autoComplete="off"
        >
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="invite-modal-email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-modal-email"
                name="invite-email"
                type="email"
                placeholder="trainer@example.com"
                value={formData.email}
                onChange={handleInputEvent("email")}
                onInput={handleInputEvent("email")}
                autoComplete="new-email"
                className={`pl-9 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="invite-modal-name" className="text-sm font-medium">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-modal-name"
                name="invite-name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputEvent("name")}
                onInput={handleInputEvent("name")}
                autoComplete="new-name"
                className={`pl-9 ${errors.name ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Trainer Role
            </Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleInputChange("role", value)}
            >
              <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select trainer role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FITNESS_TRAINER">
                  {getRoleDisplayName("FITNESS_TRAINER")}
                </SelectItem>
                <SelectItem value="FITNESS_TRAINER_ADMIN">
                  {getRoleDisplayName("FITNESS_TRAINER_ADMIN")}
                </SelectItem>
                <SelectItem value="PSYCHOLOGY_TRAINER">
                  {getRoleDisplayName("PSYCHOLOGY_TRAINER")}
                </SelectItem>
                <SelectItem value="MANIFESTATION_TRAINER">
                  {getRoleDisplayName("MANIFESTATION_TRAINER")}
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              An invitation email will be sent to the trainer with instructions to join the platform.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>Sending...</>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
