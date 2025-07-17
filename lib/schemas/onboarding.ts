import { z } from 'zod'

export const onboardingSchema = z.object({
  // Step 1: Basic Info
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
    
  email: z.string()
    .email("Invalid email address"),
    
  role: z.enum(["CLIENT", "TRAINER"], {
    required_error: "Please select your role"
  }),

  // Step 2: Body Metrics
  weight: z.coerce.number()
    .min(30, "Weight must be at least 30")
    .max(300, "Weight must be less than 300"),
    
  weightUnit: z.enum(["KG", "LB"]).default("KG"),
  
  height: z.coerce.number()
    .min(100, "Height must be at least 100")
    .max(250, "Height must be less than 250"),
    
  heightUnit: z.enum(["CM", "INCHES"]).default("CM"),
  
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
  ]).default("SEDENTARY")
})

export type OnboardingData = z.infer<typeof onboardingSchema> 