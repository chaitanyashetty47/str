"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, CheckCircle } from "lucide-react";

interface EmailCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailCaptured: (email: string) => void;
}

export const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({ 
  open, 
  onOpenChange, 
  onEmailCaptured 
}) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationError("");

    if (!validateEmail(email)) {
      setValidationError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call your calendly-partial API to capture email
      const response = await fetch("/api/calendly-partial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error("Failed to capture email");

      // Close modal and trigger calendly embed
      onEmailCaptured(email);
      setEmail("");
      
    } catch (error) {
      console.error("Error capturing email:", error);
      setValidationError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Calendar className="h-6 w-6 text-[#F31818]" />
            Book Your Discovery Call
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Get instant access to our calendar and book your personalized consultation.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>No spam, just valuable insights</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="h-12 text-lg"
            />
            {validationError && (
              <p className="text-red-500 text-sm">{validationError}</p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full h-12 text-lg font-semibold bg-[#F31818] hover:bg-[#F31818]/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Preparing Calendar...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-5 w-5" />
                Access Calendar
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 