# Strentor Onboarding Flow - Complete Implementation Guide

## 🎯 Overview

This document outlines the complete end-to-end onboarding flow for Strentor users after signup, using a **State-Based Multi-Step Form** with localStorage backup for data persistence.

## 🚀 User Journey Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE USER FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

1. 📧 EMAIL SIGNUP
   /sign-up → Enter email/password → Create account → Email verification

2. ✅ EMAIL VERIFICATION  
   User clicks email link → /auth/callback → Redirect to onboarding

3. 👤 ONBOARDING WIZARD (State-Based Multi-Step)
   /onboarding → Step 1: Basic Info → Step 2: Body Metrics → Step 3: Review

4. 🎉 COMPLETION
   Save to database → Mark profile complete → Redirect to dashboard

5. 🔄 RETURN USERS
   /sign-in → Check profile completion → Skip to dashboard OR resume onboarding
```

## 📁 File Structure

```
strentor/
├── app/
│   ├── (auth-pages)/
│   │   ├── sign-up/
│   │   │   └── page.tsx                     # Enhanced signup with onboarding redirect
│   │   ├── sign-in/
│   │   │   └── page.tsx                     # Enhanced signin with profile check
│   │   └── onboarding/
│   │       ├── page.tsx                     # Main onboarding wrapper page
│   │       └── loading.tsx                  # Loading state
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts                     # Enhanced callback with onboarding redirect
│   └── actions/
│       ├── auth.ts                          # Enhanced auth actions
│       └── onboarding.ts                    # New onboarding server actions
├── components/
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx            # Main multi-step form component
│   │   ├── steps/
│   │   │   ├── BasicInfoStep.tsx           # Step 1: Name, role, email confirmation
│   │   │   ├── BodyMetricsStep.tsx         # Step 2: Weight, height, DOB, gender
│   │   │   └── ReviewStep.tsx              # Step 3: Review and confirm
│   │   ├── ProgressIndicator.tsx           # Progress bar component
│   │   ├── StepNavigation.tsx              # Back/Next button component
│   │   └── ProfileCompletionCheck.tsx      # Component to check completion status
│   └── ui/
│       ├── form.tsx                        # Enhanced form components
│       └── multi-step-progress.tsx         # Reusable progress component
├── hooks/
│   ├── useOnboarding.ts                    # Custom hook for onboarding logic
│   ├── useLocalStorage.ts                  # Custom hook for localStorage
│   └── useProfileCompletion.ts             # Custom hook to check profile status
├── lib/
│   ├── schemas/
│   │   ├── auth.ts                         # Zod schemas for auth
│   │   └── onboarding.ts                   # Zod schemas for onboarding
│   └── utils/
│       ├── onboarding-utils.ts             # Utility functions
│       └── profile-utils.ts                # Profile completion utilities
└── types/
    ├── auth.ts                             # Auth type definitions
    └── onboarding.ts                       # Onboarding type definitions
```

## 🗄️ Database Schema Updates

### User Model Enhancement
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  
  // Basic Info (Step 1)
  name              String?
  role              Role      @default(CLIENT)
  
  // Body Metrics (Step 2)  
  weight            Float?
  weightUnit        WeightUnit @default(KG)
  height            Float?
  heightUnit        HeightUnit @default(CM)
  dateOfBirth       DateTime?  @db.Date
  gender            Gender?
  activityLevel     ActivityLevel @default(SEDENTARY)
  
  // Onboarding Tracking
  profileCompleted  Boolean   @default(false)
  onboardingStarted DateTime?
  onboardingCompleted DateTime?
  
  // Existing relations...
  weightLogs        WeightLog[]
  calculatorSessions CalculatorSession[]
  // ... other relations
  
  @@schema("public")
}
```

## 🔗 Routes & Navigation

### Route Structure
```typescript
// Route definitions
/sign-up                    # Email/password signup
/sign-in                    # Email/password signin  
/onboarding                 # Multi-step onboarding wizard
/auth/callback             # Supabase auth callback (enhanced)
/dashboard                 # Main dashboard (profile completed users)
```

### Route Protection Logic
```typescript
// middleware.ts enhancement
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* config */)
  const { data: { user } } = await supabase.auth.getUser()
  
  const url = request.nextUrl.clone()
  
  if (user) {
    // Check if user has completed profile
    const userProfile = await getUserProfile(user.id)
    
    // Redirect incomplete profiles to onboarding
    if (!userProfile?.profileCompleted && url.pathname !== '/onboarding') {
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
    
    // Redirect completed profiles away from onboarding
    if (userProfile?.profileCompleted && url.pathname === '/onboarding') {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }
  
  return NextResponse.next()
}
```

## 🧩 Core Components Implementation

### 1. Main Onboarding Wizard
```typescript
// components/onboarding/OnboardingWizard.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { onboardingSchema, type OnboardingData } from '@/lib/schemas/onboarding'
import { completeOnboardingAction } from '@/app/actions/onboarding'
import { useLocalStorage } from '@/hooks/useLocalStorage'

import BasicInfoStep from './steps/BasicInfoStep'
import BodyMetricsStep from './steps/BodyMetricsStep'
import ReviewStep from './steps/ReviewStep'
import ProgressIndicator from './ProgressIndicator'
import StepNavigation from './StepNavigation'

const STEPS = [
  { id: 1, title: 'Basic Information', description: 'Tell us about yourself' },
  { id: 2, title: 'Body Metrics', description: 'Your fitness baseline' },
  { id: 3, title: 'Review', description: 'Confirm your details' }
]

export default function OnboardingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // localStorage integration
  const [savedData, setSavedData] = useLocalStorage<Partial<OnboardingData>>('strentor_onboarding', {})
  const [savedStep, setSavedStep] = useLocalStorage<number>('strentor_onboarding_step', 1)

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      role: 'CLIENT',
      weightUnit: 'KG',
      heightUnit: 'CM', 
      activityLevel: 'SEDENTARY',
      ...savedData // Load saved data
    }
  })

  // Restore saved step on mount
  useEffect(() => {
    if (savedStep > 1) {
      setCurrentStep(savedStep)
    }
  }, [savedStep])

  // Auto-save form data to localStorage
  useEffect(() => {
    const subscription = form.watch((data) => {
      setSavedData(data as Partial<OnboardingData>)
    })
    return () => subscription.unsubscribe()
  }, [form, setSavedData])

  // Save current step to localStorage
  useEffect(() => {
    setSavedStep(currentStep)
  }, [currentStep, setSavedStep])

  // Step validation configuration
  const stepValidations = {
    1: ['name', 'role'] as const,
    2: ['weight', 'height', 'dateOfBirth', 'gender'] as const,
    3: [] as const
  }

  const validateCurrentStep = async () => {
    const fieldsToValidate = stepValidations[currentStep as keyof typeof stepValidations]
    if (fieldsToValidate.length === 0) return true
    
    const isValid = await form.trigger(fieldsToValidate)
    
    if (!isValid) {
      toast.error('Please fix the errors before continuing')
    }
    
    return isValid
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async (data: OnboardingData) => {
    setIsSubmitting(true)
    
    try {
      const result = await completeOnboardingAction(data)
      
      if (result.success) {
        // Clear localStorage on success
        setSavedData({})
        setSavedStep(1)
        
        toast.success('Welcome to Strentor! Your profile is now complete.')
        router.push('/dashboard')
      } else {
        toast.error(result.error || 'Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Onboarding submission error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep form={form} />
      case 2:
        return <BodyMetricsStep form={form} />
      case 3:
        return <ReviewStep form={form} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to <span className="text-primary">Strentor</span>
          </h1>
          <p className="text-gray-600">
            Let's set up your profile to get started
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator 
          steps={STEPS}
          currentStep={currentStep}
          className="mb-8"
        />

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Step Content */}
            <div className="min-h-[400px]">
              {renderCurrentStep()}
            </div>

            {/* Navigation */}
            <StepNavigation
              currentStep={currentStep}
              totalSteps={STEPS.length}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isSubmitting={isSubmitting}
              isLastStep={currentStep === STEPS.length}
            />
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Your progress is automatically saved
        </div>
      </div>
    </div>
  )
}
```

### 2. Step Components

#### Basic Info Step (Step 1)
```typescript
// components/onboarding/steps/BasicInfoStep.tsx
import { UseFormReturn } from 'react-hook-form'
import { OnboardingData } from '@/types/onboarding'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface BasicInfoStepProps {
  form: UseFormReturn<OnboardingData>
}

export default function BasicInfoStep({ form }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Basic Information
        </h2>
        <p className="text-gray-600">
          Let's start with some basic details about you
        </p>
      </div>

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
          Full Name *
        </Label>
        <Input
          {...form.register('name')}
          id="name"
          placeholder="Enter your full name"
          className="w-full"
        />
        {form.formState.errors.name && (
          <p className="text-red-600 text-sm">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Role Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          I am a... *
        </Label>
        <RadioGroup
          value={form.watch('role')}
          onValueChange={(value) => form.setValue('role', value as 'CLIENT' | 'TRAINER')}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50">
            <RadioGroupItem value="CLIENT" id="client" />
            <div className="flex-1">
              <Label htmlFor="client" className="cursor-pointer">
                <div className="font-medium">Client</div>
                <div className="text-sm text-gray-500">
                  I want to get fit and healthy
                </div>
              </Label>
            </div>
          </div>
          <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50">
            <RadioGroupItem value="TRAINER" id="trainer" />
            <div className="flex-1">
              <Label htmlFor="trainer" className="cursor-pointer">
                <div className="font-medium">Trainer</div>
                <div className="text-sm text-gray-500">
                  I help others reach their goals
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>
        {form.formState.errors.role && (
          <p className="text-red-600 text-sm">
            {form.formState.errors.role.message}
          </p>
        )}
      </div>

      {/* Email Display (Read-only) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input
          value={form.watch('email') || 'Loading...'}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500">
          This is the email you used to sign up
        </p>
      </div>
    </div>
  )
}
```

#### Body Metrics Step (Step 2)
```typescript
// components/onboarding/steps/BodyMetricsStep.tsx
import { UseFormReturn } from 'react-hook-form'
import { OnboardingData } from '@/types/onboarding'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface BodyMetricsStepProps {
  form: UseFormReturn<OnboardingData>
}

export default function BodyMetricsStep({ form }: BodyMetricsStepProps) {
  const weightUnit = form.watch('weightUnit')
  const heightUnit = form.watch('heightUnit')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Body Metrics
        </h2>
        <p className="text-gray-600">
          This helps us personalize your experience and calculations
        </p>
      </div>

      {/* Weight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
            Current Weight *
          </Label>
          <Input
            {...form.register('weight')}
            id="weight"
            type="number"
            placeholder={weightUnit === 'KG' ? '70' : '154'}
            className="w-full"
          />
          {form.formState.errors.weight && (
            <p className="text-red-600 text-sm">
              {form.formState.errors.weight.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Unit</Label>
          <Select
            value={weightUnit}
            onValueChange={(value) => form.setValue('weightUnit', value as 'KG' | 'LB')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KG">kg</SelectItem>
              <SelectItem value="LB">lbs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Height */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="height" className="text-sm font-medium text-gray-700">
            Height *
          </Label>
          <Input
            {...form.register('height')}
            id="height"
            type="number"
            placeholder={heightUnit === 'CM' ? '175' : '69'}
            className="w-full"
          />
          {form.formState.errors.height && (
            <p className="text-red-600 text-sm">
              {form.formState.errors.height.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Unit</Label>
          <Select
            value={heightUnit}
            onValueChange={(value) => form.setValue('heightUnit', value as 'CM' | 'INCHES')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CM">cm</SelectItem>
              <SelectItem value="INCHES">inches</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
          Date of Birth *
        </Label>
        <Input
          {...form.register('dateOfBirth')}
          id="dateOfBirth"
          type="date"
          className="w-full md:w-1/2"
        />
        {form.formState.errors.dateOfBirth && (
          <p className="text-red-600 text-sm">
            {form.formState.errors.dateOfBirth.message}
          </p>
        )}
      </div>

      {/* Gender */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Gender *
        </Label>
        <RadioGroup
          value={form.watch('gender')}
          onValueChange={(value) => form.setValue('gender', value as 'MALE' | 'FEMALE')}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="MALE" id="male" />
            <Label htmlFor="male" className="cursor-pointer">Male</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="FEMALE" id="female" />
            <Label htmlFor="female" className="cursor-pointer">Female</Label>
          </div>
        </RadioGroup>
        {form.formState.errors.gender && (
          <p className="text-red-600 text-sm">
            {form.formState.errors.gender.message}
          </p>
        )}
      </div>

      {/* Activity Level */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Activity Level
        </Label>
        <Select
          value={form.watch('activityLevel')}
          onValueChange={(value) => form.setValue('activityLevel', value as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEDENTARY">
              <div>
                <div className="font-medium">Sedentary</div>
                <div className="text-sm text-gray-500">Little to no exercise</div>
              </div>
            </SelectItem>
            <SelectItem value="LIGHTLY_ACTIVE">
              <div>
                <div className="font-medium">Lightly Active</div>
                <div className="text-sm text-gray-500">Light exercise 1-3 days/week</div>
              </div>
            </SelectItem>
            <SelectItem value="MODERATELY_ACTIVE">
              <div>
                <div className="font-medium">Moderately Active</div>
                <div className="text-sm text-gray-500">Moderate exercise 3-5 days/week</div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          This helps us calculate your calorie needs accurately
        </p>
      </div>
    </div>
  )
}
```

#### Review Step (Step 3)
```typescript
// components/onboarding/steps/ReviewStep.tsx
import { UseFormReturn } from 'react-hook-form'
import { OnboardingData } from '@/types/onboarding'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ReviewStepProps {
  form: UseFormReturn<OnboardingData>
}

export default function ReviewStep({ form }: ReviewStepProps) {
  const data = form.watch()
  
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Review Your Information
        </h2>
        <p className="text-gray-600">
          Please review your details before completing setup
        </p>
      </div>

      <div className="grid gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{data.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{data.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <Badge variant={data.role === 'TRAINER' ? 'default' : 'secondary'}>
                {data.role === 'TRAINER' ? 'Trainer' : 'Client'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Age:</span>
              <span className="font-medium">
                {data.dateOfBirth ? calculateAge(data.dateOfBirth) : 'N/A'} years
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gender:</span>
              <span className="font-medium">{data.gender}</span>
            </div>
          </CardContent>
        </Card>

        {/* Body Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Body Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Weight:</span>
              <span className="font-medium">
                {data.weight} {data.weightUnit?.toLowerCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Height:</span>
              <span className="font-medium">
                {data.height} {data.heightUnit?.toLowerCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Activity Level:</span>
              <span className="font-medium">
                {data.activityLevel?.replace('_', ' ')?.toLowerCase()?.replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="text-green-700 space-y-2">
            <p>✅ Access to personalized calculators</p>
            <p>✅ Track your fitness progress</p>
            {data.role === 'TRAINER' && (
              <p>✅ Create and manage client workout plans</p>
            )}
            {data.role === 'CLIENT' && (
              <p>✅ Follow customized workout plans</p>
            )}
            <p>✅ Join our community of fitness enthusiasts</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

## 💾 localStorage Implementation

### Custom localStorage Hook
```typescript
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Get from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key)
        if (item) {
          setStoredValue(JSON.parse(item))
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
    }
  }, [key])

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}
```

### Onboarding Storage Utilities
```typescript
// lib/utils/onboarding-utils.ts
import { OnboardingData } from '@/types/onboarding'

const STORAGE_KEYS = {
  ONBOARDING_DATA: 'strentor_onboarding',
  ONBOARDING_STEP: 'strentor_onboarding_step',
  ONBOARDING_STARTED: 'strentor_onboarding_started'
} as const

export class OnboardingStorage {
  static saveData(data: Partial<OnboardingData>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
    }
  }

  static loadData(): Partial<OnboardingData> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Failed to load onboarding data:', error)
      return {}
    }
  }

  static saveStep(step: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, step.toString())
    } catch (error) {
      console.error('Failed to save onboarding step:', error)
    }
  }

  static loadStep(): number {
    try {
      const step = localStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP)
      return step ? parseInt(step, 10) : 1
    } catch (error) {
      console.error('Failed to load onboarding step:', error)
      return 1
    }
  }

  static markStarted(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_STARTED, new Date().toISOString())
    } catch (error) {
      console.error('Failed to mark onboarding started:', error)
    }
  }

  static clear(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Failed to clear onboarding data:', error)
    }
  }

  static hasStoredData(): boolean {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA)
      return data !== null && Object.keys(JSON.parse(data)).length > 0
    } catch (error) {
      return false
    }
  }
}
```

## 🔧 Server Actions

### Enhanced Auth Actions
```typescript
// app/actions/auth.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { encodedRedirect } from '@/utils/utils'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from '@/utils/prisma/prismaClient'

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString()
  const password = formData.get("password")?.toString()
  const supabase = await createClient()

  if (!email || !password) {
    return encodedRedirect("error", "/sign-up", "Email and password are required")
  }

  // Create Supabase user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        email_confirm: false // We'll handle this in callback
      }
    }
  })

  if (error) {
    console.error(error.code + " " + error.message)
    return encodedRedirect("error", "/sign-up", error.message)
  }

  // Create user record in database
  if (data.user) {
    try {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
          profileCompleted: false,
          onboardingStarted: new Date()
        }
      })
    } catch (dbError) {
      console.error('Failed to create user record:', dbError)
      // Continue with flow - user exists in Supabase
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link."
  )
}

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message)
  }

  // Check if user has completed onboarding
  const user = await supabase.auth.getUser()
  if (user.data.user) {
    const userProfile = await prisma.user.findUnique({
      where: { id: user.data.user.id },
      select: { profileCompleted: true }
    })

    if (!userProfile?.profileCompleted) {
      return redirect("/onboarding")
    }
  }

  return redirect("/dashboard")
}
```

### Onboarding Server Actions
```typescript
// app/actions/onboarding.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { onboardingSchema } from '@/lib/schemas/onboarding'
import { redirect } from 'next/navigation'
import prisma from '@/utils/prisma/prismaClient'

export async function completeOnboardingAction(data: unknown) {
  // Validate data
  const result = onboardingSchema.safeParse(data)
  if (!result.success) {
    return {
      success: false,
      error: 'Invalid form data',
      fieldErrors: result.error.flatten().fieldErrors
    }
  }

  // Get authenticated user
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'Authentication required'
    }
  }

  try {
    // Update user profile in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: result.data.name,
        role: result.data.role,
        weight: result.data.weight,
        weightUnit: result.data.weightUnit,
        height: result.data.height,
        heightUnit: result.data.heightUnit,
        dateOfBirth: new Date(result.data.dateOfBirth),
        gender: result.data.gender,
        activityLevel: result.data.activityLevel,
        profileCompleted: true,
        onboardingCompleted: new Date()
      }
    })

    // Create initial weight log entry
    await prisma.weightLog.create({
      data: {
        userId: user.id,
        weight: result.data.weight,
        weightUnit: result.data.weightUnit,
        dateLogged: new Date(),
        notes: 'Initial weight from onboarding'
      }
    })

    return { success: true, user: updatedUser }
  } catch (error) {
    console.error('Failed to complete onboarding:', error)
    return {
      success: false,
      error: 'Failed to save profile. Please try again.'
    }
  }
}

export async function getUserOnboardingStatus(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profileCompleted: true,
        onboardingStarted: true,
        onboardingCompleted: true,
        name: true,
        weight: true,
        height: true
      }
    })

    return { success: true, user }
  } catch (error) {
    console.error('Failed to get onboarding status:', error)
    return { success: false, error: 'Failed to check onboarding status' }
  }
}
```

## 🎯 Enhanced Auth Callback

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/utils/prisma/prismaClient'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user profile exists and is complete
      const userProfile = await prisma.user.findUnique({
        where: { id: data.user.id },
        select: { 
          profileCompleted: true,
          onboardingStarted: true
        }
      })

      // If user doesn't exist in our database, create them
      if (!userProfile) {
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            profileCompleted: false,
            onboardingStarted: new Date()
          }
        })
        
        // Redirect to onboarding for new users
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // If profile not completed, redirect to onboarding
      if (!userProfile.profileCompleted) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // Profile completed, redirect to intended destination
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed, redirect to signin
  return NextResponse.redirect(`${origin}/sign-in`)
}
```

## 🔍 Type Definitions

```typescript
// types/onboarding.ts
import { z } from 'zod'
import { onboardingSchema } from '@/lib/schemas/onboarding'

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
```

```typescript
// lib/schemas/onboarding.ts
import { z } from 'zod'

export const onboardingSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"), // Auto-filled
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
```

## 📱 Mobile Optimization

```css
/* globals.css additions */
@layer components {
  .onboarding-container {
    @apply min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100;
    @apply px-4 py-6 md:px-6 md:py-8;
  }
  
  .onboarding-card {
    @apply bg-white rounded-lg shadow-sm border;
    @apply p-4 md:p-8;
    @apply max-w-2xl mx-auto;
  }
  
  .step-content {
    @apply min-h-[350px] md:min-h-[400px];
    @apply space-y-6;
  }
  
  .step-navigation {
    @apply flex justify-between items-center;
    @apply pt-6 border-t border-gray-100;
    @apply sticky bottom-0 bg-white;
  }
  
  @media (max-width: 768px) {
    .step-navigation {
      @apply fixed bottom-0 left-0 right-0;
      @apply p-4 border-t;
      @apply shadow-lg;
    }
    
    .step-content {
      @apply pb-20; /* Space for fixed navigation */
    }
  }
}
```

## 🚀 Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Create file structure
- [ ] Set up Zod schemas
- [ ] Implement localStorage hooks
- [ ] Create basic components

### Phase 2: Core Components (Day 2)
- [ ] Build OnboardingWizard component
- [ ] Implement all 3 step components
- [ ] Add progress indicator
- [ ] Set up navigation logic

### Phase 3: Integration (Day 3)
- [ ] Enhance auth actions
- [ ] Create onboarding server actions
- [ ] Update auth callback
- [ ] Add middleware protection

### Phase 4: Testing & Polish (Day 4)
- [ ] Test localStorage persistence
- [ ] Test form validation
- [ ] Test mobile responsiveness
- [ ] Add error handling
- [ ] Test complete user flow

## 🔄 Data Flow Summary

```
User Signs Up → Email Verification → Onboarding Wizard
     ↓              ↓                     ↓
Create User     Update Email          Step 1: Basic Info
in Database     Confirmed             ↓ (auto-save to localStorage)
                                     Step 2: Body Metrics  
                                     ↓ (auto-save to localStorage)
                                     Step 3: Review
                                     ↓
                                     Submit to Database
                                     ↓
                                     Mark Profile Complete
                                     ↓
                                     Clear localStorage
                                     ↓
                                     Redirect to Dashboard
```

This implementation provides a seamless, mobile-friendly onboarding experience with automatic progress saving and data persistence across sessions.
