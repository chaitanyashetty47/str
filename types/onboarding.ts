import { z } from 'zod'
import { isValidPhoneNumber } from 'libphonenumber-js'
import { isValidAlpha3Code } from '@/utils/country-mapping'
import { ONBOARDING_FORM_KEYS } from '@/components/onboarding/constants/onboarding-constants'

// Generate form field keys type from constants
export type OnboardingFormKeysType = 
  (typeof ONBOARDING_FORM_KEYS)[keyof typeof ONBOARDING_FORM_KEYS][number];

// Enhanced form values type with conditional typing
export type OnboardingFormValues = {
  [FieldName in OnboardingFormKeysType]: FieldName extends 
    | "weight" | "height" | "neck" | "waist" | "hips"
    ? number 
    : string;
};

// Onboarding schema without role field (users are CLIENT by default)
export const onboardingSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"), // Auto-filled
  
  country: z.string()
    .min(3, "Please select a country")
    .max(3, "Invalid country code")
    .refine((code) => isValidAlpha3Code(code), "Invalid country selection"),
    
  phone: z.string()
    .optional()
    .refine((value) => {
      if (!value || value.trim() === '') return true; // Optional field
      try {
        return isValidPhoneNumber(value);
      } catch {
        return false;
      }
    }, "Invalid phone number format")
    .refine((value) => {
      if (!value || value.trim() === '') return true;
      return value.startsWith('+');
    }, "Phone number must start with +"),

  // Step 2: Body Metrics
  weight: z.coerce.number()
    .min(30, "Weight must be at least 30kg")
    .max(300, "Weight must be less than 300kg"),
  
  height: z.coerce.number()
    .min(100, "Height must be at least 100cm")
    .max(250, "Height must be less than 250cm"),
  
  dateOfBirth: z.string()
    .refine(val => {
      const date = new Date(val)
      const age = new Date().getFullYear() - date.getFullYear()
      return age >= 13 && age <= 100
    }, "Must be between 13-100 years old"),
    
  gender: z.enum(["MALE", "FEMALE"], {
    required_error: "Please select your gender"
  }),
  
  activityLevel: z.enum([
    "SEDENTARY",
    "LIGHTLY_ACTIVE", 
    "MODERATELY_ACTIVE",
    "VERY_ACTIVE",
    "EXTRA_ACTIVE"
  ]).default("SEDENTARY"),

  // Step 3: Optional Body Measurements
  neck: z.coerce.number()
    .min(25, "Neck measurement must be at least 25cm")
    .max(60, "Neck measurement must be less than 60cm")
    .optional()
    .or(z.literal('')),
  
  waist: z.coerce.number()
    .min(50, "Waist measurement must be at least 50cm")
    .max(150, "Waist measurement must be less than 150cm")
    .optional()
    .or(z.literal('')),
  
  hips: z.coerce.number()
    .min(70, "Hip measurement must be at least 70cm")
    .max(150, "Hip measurement must be less than 150cm")
    .optional()
    .or(z.literal('')),
  
})

export type OnboardingData = z.infer<typeof onboardingSchema>

export interface OnboardingStep {
  id: number
  title: string
  description: string
  fields: (keyof OnboardingData)[]
}

export interface OnboardingState {
  currentStep: number
  data: Partial<OnboardingData>
  isSubmitting: boolean
  errors: Record<string, string>
}

// Enhanced error handling types
export interface OnboardingError {
  field?: string
  message: string
  step?: number
}

export interface OnboardingFormState {
  activeStep: number
  erroredInputName: string
  isSubmitting: boolean
  errors: Record<string, OnboardingError>
} 