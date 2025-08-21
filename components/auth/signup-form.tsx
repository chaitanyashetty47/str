"use client";

import { useState } from "react";
import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength } from "@/components/ui/password-strength";
import { ResendEmailModal } from "./resend-email-modal";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface SignUpFormProps {
  searchParams: Message;
}

export function SignUpForm({ searchParams }: SignUpFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasResent, setHasResent] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if we have a success message
  const hasSuccessMessage = searchParams && 'message' in searchParams && 
    searchParams.message?.includes('Thanks for signing up');

  // If we have a success message and haven't shown success state yet, show success
  if (hasSuccessMessage && !isSuccess) {
    setIsSuccess(true);
  }

  // If success state, show success message with resend option
  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#00D115]/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-[#00D115]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Check your email!</h3>
          <p className="text-gray-600">
            We've sent a confirmation link to <span className="font-semibold">{email}</span>
          </p>
          <p className="text-sm text-gray-500">
            Click the link in your email to verify your account and get started.
          </p>
        </div>

        {!hasResent && (
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              📧 Didn't get the email yet?
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="text-[#F31818] border-[#F31818] hover:bg-[#F31818] hover:text-white rounded-full"
            >
              Let's Try Again
            </Button>
          </div>
        )}

        {hasResent && (
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ New confirmation email sent! Check your inbox.
            </p>
          </div>
        )}

        <div className="text-center">
          <Button
            onClick={() => {
              setIsSuccess(false);
              setHasResent(false);
              setEmail("");
            }}
            variant="outline"
            className="rounded-full"
          >
            Sign Up with Different Email
          </Button>
        </div>

        <ResendEmailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          email={email}
          onResendSuccess={() => {
            setHasResent(true);
            setIsModalOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <form className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="font-semibold">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Enter your full name"
          required
          className="w-full p-3 border-2 rounded-lg focus:border-[#F31818] transition-colors"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="font-semibold">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border-2 rounded-lg focus:border-[#F31818] transition-colors"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password" className="font-semibold">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Create a password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border-2 rounded-lg focus:border-[#F31818] transition-colors"
        />
        <PasswordStrength password={password} className="mt-2" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="font-semibold">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-3 border-2 rounded-lg focus:border-[#F31818] transition-colors"
        />
        {password && confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>
      
      <SubmitButton
        formAction={signUpAction}
        pendingText="Creating account..."
        className="w-full bg-[#F31818] hover:bg-[#F31818]/90 text-white font-bold py-3 rounded-full text-lg transform hover:scale-105 transition-all"
      >
        Get Started
      </SubmitButton>
      
      <FormMessage message={searchParams} />
    </form>
  );
}
