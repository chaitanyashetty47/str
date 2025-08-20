"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const [checks, setChecks] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    setChecks({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[^a-zA-Z0-9]/.test(password),
    });
  }, [password]);

  const requirements = [
    { key: 'length', label: 'At least 8 characters', check: checks.length },
    { key: 'lowercase', label: 'One lowercase letter', check: checks.lowercase },
    { key: 'uppercase', label: 'One uppercase letter', check: checks.uppercase },
    { key: 'number', label: 'One number', check: checks.number },
    { key: 'special', label: 'One special character', check: checks.special },
  ];

  if (!password) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
      <div className="space-y-1">
        {requirements.map((req) => (
          <div key={req.key} className="flex items-center gap-2 text-xs">
            {req.check ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <X className="w-3 h-3 text-red-500" />
            )}
            <span className={req.check ? "text-green-600" : "text-red-500"}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
