"use client";

import { useState } from "react";
import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength } from "@/components/ui/password-strength";

interface SignUpFormProps {
  searchParams: Message;
}

export function SignUpForm({ searchParams }: SignUpFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
