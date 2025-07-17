# Multi-Step Onboarding Implementation Guide
## Complete Reference for Future Projects

## 🎯 Overview

This document provides a comprehensive comparison and implementation guide for three different approaches to building multi-step onboarding flows. Use this as a reference when starting new projects to choose the right approach based on your specific requirements.

## 📊 Quick Decision Matrix

| Requirement | State-Based | URL-Based | Server Integration |
|-------------|------------|-----------|-------------------|
| **Simple Implementation** | ✅ Best | ⚠️ Medium | ❌ Complex |
| **Page Refresh Handling** | ❌ Poor | ✅ Best | ✅ Best |
| **SEO Requirements** | ❌ Poor | ⚠️ Medium | ✅ Best |
| **Analytics Tracking** | ⚠️ Limited | ✅ Best | ✅ Best |
| **Mobile Performance** | ✅ Best | ⚠️ Medium | ⚠️ Medium |
| **Data Persistence** | ⚠️ localStorage | ✅ URL + localStorage | ✅ Server |
| **Development Speed** | ✅ Fastest | ⚠️ Medium | ❌ Slowest |
| **User Bookmarking** | ❌ No | ✅ Yes | ✅ Yes |
| **Back/Forward Support** | ❌ No | ✅ Yes | ✅ Yes |
| **Works without JS** | ❌ No | ❌ No | ✅ Yes |

## 🏗️ Approach 1: State-Based Multi-Step Form

### 🎯 When to Use
- **Onboarding flows** (one-time completion)
- **Short forms** (3-5 steps max)
- **Mobile-first** applications
- **Quick development** timelines
- **Simple data** (no complex validation)

### ✅ Pros
- **Fastest development** - 2-3 hours implementation
- **Excellent performance** - No page reloads
- **Simple debugging** - Single component state
- **Mobile optimized** - Smooth transitions
- **Lightweight** - Minimal routing complexity

### ❌ Cons
- **Data loss on refresh** - Requires localStorage backup
- **No deep linking** - Can't bookmark specific steps
- **Limited analytics** - Harder to track step-specific metrics
- **No browser navigation** - Back/forward buttons don't work

### 🛠 Complete Implementation

#### Core Architecture
```typescript
// components/StateBasedOnboarding.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const STEPS = [
  { id: 1, title: 'Personal Info', component: PersonalInfoStep },
  { id: 2, title: 'Preferences', component: PreferencesStep },
  { id: 3, title: 'Review', component: ReviewStep }
]

export default function StateBasedOnboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // localStorage backup
  const [savedData, setSavedData] = useLocalStorage('onboarding_data', {})
  const [savedStep, setSavedStep] = useLocalStorage('onboarding_step', 1)

  const form = useForm<FormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      ...defaultValues,
      ...savedData // Restore saved data
    }
  })

  // Restore step on mount
  useEffect(() => {
    setCurrentStep(savedStep)
  }, [savedStep])

  // Auto-save data changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      setSavedData(data)
    })
    return () => subscription.unsubscribe()
  }, [form, setSavedData])

  // Save step changes
  useEffect(() => {
    setSavedStep(currentStep)
  }, [currentStep, setSavedStep])

  // Step validation
  const stepValidations = {
    1: ['name', 'email'] as const,
    2: ['preferences', 'interests'] as const,
    3: [] as const
  }

  const validateStep = async (step: number) => {
    const fields = stepValidations[step as keyof typeof stepValidations]
    return fields.length === 0 || await form.trigger(fields)
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await submitOnboardingAction(data)
      // Clear localStorage on success
      setSavedData({})
      setSavedStep(1)
      router.push('/dashboard')
    } catch (error) {
      toast.error('Failed to complete onboarding')
    } finally {
      setIsSubmitting(false)
    }
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component

  return (
    <div className="onboarding-container">
      {/* Progress Indicator */}
      <ProgressBar currentStep={currentStep} totalSteps={STEPS.length} />
      
      {/* Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="step-content">
          <CurrentStepComponent form={form} />
        </div>
        
        {/* Navigation */}
        <div className="step-navigation">
          {currentStep > 1 && (
            <Button type="button" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          
          {currentStep < STEPS.length ? (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Completing...' : 'Complete'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
```

#### localStorage Hook
```typescript
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

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

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
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

#### Step Components
```typescript
// components/steps/PersonalInfoStep.tsx
interface StepProps {
  form: UseFormReturn<FormData>
}

export function PersonalInfoStep({ form }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Personal Information</h2>
        <p className="text-gray-600">Tell us about yourself</p>
      </div>
      
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
```

### 📱 Mobile Optimization
```css
@layer components {
  .onboarding-container {
    @apply min-h-screen bg-gray-50 p-4;
  }
  
  .step-content {
    @apply bg-white rounded-lg p-6 mb-4;
    min-height: 400px;
  }
  
  .step-navigation {
    @apply flex justify-between items-center;
    @apply bg-white p-4 rounded-lg;
  }
  
  @media (max-width: 768px) {
    .step-navigation {
      @apply fixed bottom-0 left-0 right-0;
      @apply border-t shadow-lg;
    }
    
    .step-content {
      @apply mb-20; /* Space for fixed navigation */
    }
  }
}
```

---

## 🌐 Approach 2: URL-Based Multi-Step Form

### 🎯 When to Use
- **Complex workflows** (shopping carts, settings wizards)
- **User research flows** where you need step analytics
- **Applications requiring bookmarkable steps**
- **Forms with conditional branching**
- **When users frequently navigate between steps**

### ✅ Pros
- **Excellent UX** - Browser back/forward works
- **Analytics friendly** - Track each step separately
- **Bookmarkable** - Users can save progress
- **Page refresh safe** - URL persists state
- **SEO benefits** - Each step can be indexed
- **Deep linking** - Direct access to specific steps

### ❌ Cons
- **Complex routing** - More files and logic
- **Development overhead** - Middleware, validation, guards
- **Performance cost** - Page navigation overhead
- **More bugs** - Edge cases with routing

### 🛠 Complete Implementation

#### File Structure
```
app/
├── onboarding/
│   ├── [step]/
│   │   ├── page.tsx           # Dynamic step page
│   │   ├── loading.tsx        # Loading state
│   │   └── error.tsx          # Error boundary
│   ├── layout.tsx             # Onboarding layout
│   └── page.tsx               # Redirect to step 1
```

#### Dynamic Step Page
```typescript
// app/onboarding/[step]/page.tsx
interface OnboardingStepPageProps {
  params: Promise<{ step: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const VALID_STEPS = ['personal-info', 'preferences', 'review']
const STEP_NUMBERS = {
  'personal-info': 1,
  'preferences': 2,
  'review': 3
}

export default async function OnboardingStepPage({ 
  params, 
  searchParams 
}: OnboardingStepPageProps) {
  const { step } = await params
  const search = await searchParams
  
  // Validate step
  if (!VALID_STEPS.includes(step)) {
    redirect('/onboarding/personal-info')
  }
  
  const stepNumber = STEP_NUMBERS[step as keyof typeof STEP_NUMBERS]
  
  // Check if user can access this step
  const canAccess = await validateStepAccess(stepNumber)
  if (!canAccess) {
    redirect('/onboarding/personal-info')
  }

  return (
    <OnboardingStepClient 
      step={step}
      stepNumber={stepNumber}
      searchParams={search}
    />
  )
}
```

#### Client Component
```typescript
// components/OnboardingStepClient.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'

interface OnboardingStepClientProps {
  step: string
  stepNumber: number
  searchParams: { [key: string]: string | string[] | undefined }
}

export function OnboardingStepClient({ 
  step, 
  stepNumber, 
  searchParams 
}: OnboardingStepClientProps) {
  const router = useRouter()
  const [formData, setFormData] = useLocalStorage('onboarding_data', {})
  
  const form = useForm({
    resolver: zodResolver(getSchemaForStep(stepNumber)),
    defaultValues: formData
  })

  // Save form data on change
  useEffect(() => {
    const subscription = form.watch((data) => {
      setFormData({ ...formData, ...data })
    })
    return () => subscription.unsubscribe()
  }, [form, formData, setFormData])

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid) {
      await saveStepProgress(stepNumber, form.getValues())
      
      const nextStep = getNextStepUrl(stepNumber)
      router.push(nextStep)
    }
  }

  const handlePrevious = () => {
    const prevStep = getPreviousStepUrl(stepNumber)
    router.push(prevStep)
  }

  const handleSubmit = async (data: FormData) => {
    const result = await completeOnboardingAction(data)
    if (result.success) {
      setFormData({}) // Clear localStorage
      router.push('/dashboard')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <ProgressIndicator currentStep={stepNumber} totalSteps={3} />
      
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {renderStepContent(step, form)}
        
        <StepNavigation
          currentStep={stepNumber}
          totalSteps={3}
          onNext={handleNext}
          onPrevious={handlePrevious}
          canGoNext={form.formState.isValid}
        />
      </form>
    </div>
  )
}
```

#### Route Utilities
```typescript
// lib/onboarding-routes.ts
export const STEP_ROUTES = {
  1: '/onboarding/personal-info',
  2: '/onboarding/preferences', 
  3: '/onboarding/review'
} as const

export const ROUTE_TO_STEP = {
  'personal-info': 1,
  'preferences': 2,
  'review': 3
} as const

export function getNextStepUrl(currentStep: number): string {
  const nextStep = currentStep + 1
  return STEP_ROUTES[nextStep as keyof typeof STEP_ROUTES] || '/dashboard'
}

export function getPreviousStepUrl(currentStep: number): string {
  const prevStep = currentStep - 1
  return STEP_ROUTES[prevStep as keyof typeof STEP_ROUTES] || '/onboarding/personal-info'
}

export function getStepFromUrl(pathname: string): number {
  const step = pathname.split('/').pop()
  return ROUTE_TO_STEP[step as keyof typeof ROUTE_TO_STEP] || 1
}
```

#### Middleware Protection
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (pathname.startsWith('/onboarding/')) {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
    
    // Check if user has already completed onboarding
    const profile = await getUserProfile(user.id)
    if (profile?.profileCompleted) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Validate step access
    const requestedStep = getStepFromUrl(pathname)
    const allowedStep = await getMaxAllowedStep(user.id)
    
    if (requestedStep > allowedStep) {
      const redirectStep = STEP_ROUTES[allowedStep as keyof typeof STEP_ROUTES]
      return NextResponse.redirect(new URL(redirectStep, request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/onboarding/:path*']
}
```

#### Step Progress Tracking
```typescript
// lib/step-progress.ts
export async function saveStepProgress(step: number, data: Partial<FormData>) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  
  await prisma.onboardingProgress.upsert({
    where: { userId: user.id },
    update: {
      currentStep: step,
      data: { ...data },
      updatedAt: new Date()
    },
    create: {
      userId: user.id,
      currentStep: step,
      data: { ...data }
    }
  })
}

export async function getStepProgress(userId: string) {
  return await prisma.onboardingProgress.findUnique({
    where: { userId }
  })
}

export async function getMaxAllowedStep(userId: string): Promise<number> {
  const progress = await getStepProgress(userId)
  return progress?.currentStep ? progress.currentStep + 1 : 1
}
```

### 📊 Analytics Integration
```typescript
// lib/analytics.ts
export function trackStepView(step: number, stepName: string) {
  // Google Analytics
  gtag('event', 'page_view', {
    page_title: `Onboarding - ${stepName}`,
    page_location: window.location.href,
    custom_step_number: step
  })
  
  // Custom analytics
  analytics.track('Onboarding Step Viewed', {
    step: step,
    stepName: stepName,
    timestamp: new Date().toISOString()
  })
}

export function trackStepCompletion(step: number, timeSpent: number) {
  analytics.track('Onboarding Step Completed', {
    step: step,
    timeSpent: timeSpent,
    timestamp: new Date().toISOString()
  })
}
```

---

## 🔧 Approach 3: Server Action Integration (SSR + Progressive Enhancement)

### 🎯 When to Use
- **SEO-critical applications** (public onboarding flows)
- **Accessibility requirements** (must work without JavaScript)
- **Enterprise applications** (security, compliance)
- **Progressive web apps** (offline functionality)
- **Forms with server-side validation**

### ✅ Pros
- **SEO friendly** - Server-rendered, indexable
- **Accessibility** - Works without JavaScript
- **Security** - Server-side validation
- **Performance** - Faster initial loads
- **Offline capable** - Progressive enhancement
- **Enterprise ready** - Compliance friendly

### ❌ Cons
- **Complex implementation** - Server + client coordination
- **Development time** - Longest to implement
- **Performance overhead** - Server round trips
- **State management complexity** - Synchronizing server/client

### 🛠 Complete Implementation

#### Server Components with Actions
```typescript
// app/onboarding/[step]/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser, getOnboardingProgress } from '@/lib/auth'
import { OnboardingForm } from './OnboardingForm'

interface OnboardingPageProps {
  params: Promise<{ step: string }>
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { step } = await params
  const stepNumber = getStepNumber(step)
  
  // Server-side auth check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  // Check if already completed
  const profile = await getUserProfile(user.id)
  if (profile?.profileCompleted) {
    redirect('/dashboard')
  }
  
  // Get saved progress from server
  const progress = await getOnboardingProgress(user.id)
  
  // Validate step access
  if (stepNumber > (progress?.maxStep || 1)) {
    redirect(`/onboarding/${getStepSlug(progress?.maxStep || 1)}`)
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <ProgressIndicator 
        currentStep={stepNumber} 
        totalSteps={3}
        serverRendered
      />
      
      <OnboardingForm 
        step={stepNumber}
        initialData={progress?.data || {}}
        userId={user.id}
      />
    </div>
  )
}
```

#### Server Actions
```typescript
// app/actions/onboarding.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const stepSchemas = {
  1: z.object({
    name: z.string().min(2),
    email: z.string().email()
  }),
  2: z.object({
    preferences: z.array(z.string()),
    interests: z.array(z.string())
  })
}

export async function saveStepAction(
  stepNumber: number,
  prevState: any,
  formData: FormData
) {
  // Get current user
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  // Parse and validate form data
  const schema = stepSchemas[stepNumber as keyof typeof stepSchemas]
  const data = Object.fromEntries(formData.entries())
  const result = schema.safeParse(data)
  
  if (!result.success) {
    return {
      error: 'Validation failed',
      fieldErrors: result.error.flatten().fieldErrors
    }
  }
  
  try {
    // Save progress to database
    await prisma.onboardingProgress.upsert({
      where: { userId: user.id },
      update: {
        currentStep: stepNumber,
        maxStep: Math.max(stepNumber, await getMaxStep(user.id)),
        data: { ...await getExistingData(user.id), ...result.data },
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        currentStep: stepNumber,
        maxStep: stepNumber,
        data: result.data
      }
    })
    
    // Revalidate current page
    revalidatePath(`/onboarding/${getStepSlug(stepNumber)}`)
    
    // Redirect to next step or completion
    const nextStep = stepNumber + 1
    if (nextStep <= 3) {
      redirect(`/onboarding/${getStepSlug(nextStep)}`)
    } else {
      // Complete onboarding
      await completeOnboarding(user.id)
      redirect('/dashboard')
    }
    
  } catch (error) {
    console.error('Failed to save step:', error)
    return { error: 'Failed to save progress' }
  }
}

export async function completeOnboarding(userId: string) {
  const progress = await getOnboardingProgress(userId)
  if (!progress) throw new Error('No onboarding progress found')
  
  // Create user profile
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...progress.data,
      profileCompleted: true,
      onboardingCompleted: new Date()
    }
  })
  
  // Clean up progress
  await prisma.onboardingProgress.delete({
    where: { userId }
  })
  
  revalidatePath('/dashboard')
}
```

#### Progressive Enhancement Form
```typescript
// components/OnboardingForm.tsx
'use client'

import { useFormState } from 'react-dom'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { saveStepAction } from '@/app/actions/onboarding'

interface OnboardingFormProps {
  step: number
  initialData: any
  userId: string
}

export function OnboardingForm({ step, initialData, userId }: OnboardingFormProps) {
  // Server action state
  const [state, formAction] = useFormState(
    saveStepAction.bind(null, step),
    { error: null }
  )
  
  // Client-side form (progressive enhancement)
  const form = useForm({
    defaultValues: initialData,
    mode: 'onChange'
  })
  
  // Handle server errors
  useEffect(() => {
    if (state.fieldErrors) {
      Object.entries(state.fieldErrors).forEach(([field, errors]) => {
        form.setError(field as any, {
          type: 'server',
          message: errors?.[0]
        })
      })
    }
  }, [state.fieldErrors, form])
  
  // Client-side submit with fallback to server action
  const handleSubmit = async (data: any) => {
    // Validate client-side first
    const isValid = await form.trigger()
    if (!isValid) return
    
    try {
      // Try client-side submission first
      const response = await fetch('/api/onboarding/save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, data })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          router.push(result.nextUrl)
          return
        }
      }
      
      // Fallback to server action
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
      formAction(formData)
      
    } catch (error) {
      // Final fallback - use server action
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
      formAction(formData)
    }
  }
  
  return (
    <>
      {/* Server-side form (works without JS) */}
      <form action={formAction} className="server-form">
        {renderStepFields(step, initialData)}
        <button type="submit">Continue</button>
      </form>
      
      {/* Client-side enhanced form (hidden when JS loads) */}
      <form 
        onSubmit={form.handleSubmit(handleSubmit)}
        className="client-form"
        style={{ display: 'none' }}
      >
        {renderEnhancedStepFields(step, form)}
        <button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </form>
      
      {/* Progressive enhancement script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.querySelector('.server-form').style.display = 'none';
            document.querySelector('.client-form').style.display = 'block';
          `
        }}
      />
    </>
  )
}
```

#### Database Schema
```prisma
model OnboardingProgress {
  id          String   @id @default(cuid())
  userId      String   @unique
  currentStep Int      @default(1)
  maxStep     Int      @default(1)
  data        Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@schema("public")
}
```

#### SEO Optimization
```typescript
// app/onboarding/[step]/layout.tsx
import { Metadata } from 'next'

const STEP_META = {
  'personal-info': {
    title: 'Personal Information - Onboarding',
    description: 'Share your basic information to get started'
  },
  'preferences': {
    title: 'Your Preferences - Onboarding', 
    description: 'Tell us about your interests and preferences'
  },
  'review': {
    title: 'Review & Complete - Onboarding',
    description: 'Review your information and complete setup'
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ step: string }> 
}): Promise<Metadata> {
  const { step } = await params
  const meta = STEP_META[step as keyof typeof STEP_META]
  
  return {
    title: meta?.title || 'Onboarding',
    description: meta?.description || 'Complete your profile setup',
    robots: {
      index: false, // Don't index onboarding pages
      follow: false
    }
  }
}
```

---

## 🎯 Real-World Use Cases & Examples

### 🏢 Enterprise Applications
**Use Case**: Employee onboarding system
**Recommended**: Server Action Integration
**Why**: Security, compliance, accessibility requirements

```typescript
// Example: Multi-tenant enterprise onboarding
export default async function EnterpriseOnboarding({ params }: {
  params: Promise<{ tenant: string, step: string }>
}) {
  const { tenant, step } = await params
  
  // Validate tenant access
  const tenantConfig = await validateTenantAccess(tenant)
  if (!tenantConfig) notFound()
  
  // Custom step configuration per tenant
  const steps = await getTenantOnboardingSteps(tenant)
  
  return (
    <TenantOnboardingForm 
      tenant={tenant}
      steps={steps}
      currentStep={step}
      config={tenantConfig}
    />
  )
}
```

### 🛒 E-commerce Checkout
**Use Case**: Multi-step checkout process
**Recommended**: URL-Based
**Why**: Users often need to navigate back, bookmarking cart state

```typescript
// Example: E-commerce checkout flow
const CHECKOUT_STEPS = [
  'cart',        // /checkout/cart
  'shipping',    // /checkout/shipping  
  'payment',     // /checkout/payment
  'review',      // /checkout/review
  'confirmation' // /checkout/confirmation
]

export default function CheckoutStep({ params }: {
  params: Promise<{ step: string }>
}) {
  // Each step is bookmarkable and shareable
  // Users can use browser back/forward
  // Analytics can track abandonment per step
}
```

### 📱 Mobile App Onboarding
**Use Case**: First-time user setup in mobile web app
**Recommended**: State-Based
**Why**: Simple, fast, mobile-optimized experience

```typescript
// Example: Mobile-first onboarding
export default function MobileOnboarding() {
  const [step, setStep] = useState(1)
  
  return (
    <div className="mobile-onboarding">
      {/* Optimized for touch interactions */}
      {/* Smooth animations between steps */}
      {/* Minimal data entry */}
    </div>
  )
}
```

### 🎓 Educational Platform
**Use Case**: Course enrollment and preference setup
**Recommended**: URL-Based with Server Actions
**Why**: SEO for course discovery, accessibility for education

```typescript
// Example: Educational onboarding with course selection
export default async function CourseOnboarding({ params }: {
  params: Promise<{ step: string }>
}) {
  const { step } = await params
  const courses = await getAvailableCourses()
  
  // SEO-friendly course pages
  // Accessible form controls
  // Server-side preference validation
  
  return (
    <CourseSelectionForm 
      step={step}
      courses={courses}
    />
  )
}
```

---

## 🔧 Advanced Patterns & Optimizations

### 1. Hybrid Approach
Combine multiple approaches for optimal UX:

```typescript
// State-based for simple steps, URL-based for complex ones
export default function HybridOnboarding() {
  const [mode, setMode] = useState<'state' | 'url'>('state')
  
  // Simple steps (1-3): State-based
  // Complex steps (4+): URL-based
  
  useEffect(() => {
    if (currentStep > 3) {
      setMode('url')
      router.push(`/onboarding/advanced/${stepSlug}`)
    }
  }, [currentStep])
  
  return mode === 'state' ? (
    <StateBasedFlow />
  ) : (
    <URLBasedFlow />
  )
}
```

### 2. Conditional Step Branching
Dynamic steps based on user responses:

```typescript
// Dynamic step flow based on user type
const getNextStep = (currentStep: number, formData: any) => {
  switch (currentStep) {
    case 1:
      return formData.userType === 'business' ? 'business-info' : 'personal-info'
    case 2:
      return formData.hasTeam ? 'team-setup' : 'preferences'
    default:
      return 'review'
  }
}
```

### 3. A/B Testing Integration
Test different onboarding flows:

```typescript
// A/B test different onboarding approaches
export default async function OnboardingWithTesting() {
  const variant = await getABTestVariant('onboarding_flow')
  
  switch (variant) {
    case 'state_based':
      return <StateBasedOnboarding />
    case 'url_based':
      return <URLBasedOnboarding />
    case 'server_enhanced':
      return <ServerEnhancedOnboarding />
    default:
      return <StateBasedOnboarding />
  }
}
```

### 4. Performance Optimizations

#### Lazy Loading Steps
```typescript
// Lazy load step components for better performance
const PersonalInfoStep = lazy(() => import('./steps/PersonalInfoStep'))
const PreferencesStep = lazy(() => import('./steps/PreferencesStep'))
const ReviewStep = lazy(() => import('./steps/ReviewStep'))

const STEP_COMPONENTS = {
  1: PersonalInfoStep,
  2: PreferencesStep,
  3: ReviewStep
}
```

#### Preloading Next Step
```typescript
// Preload next step component when current step is valid
useEffect(() => {
  if (form.formState.isValid && currentStep < totalSteps) {
    const NextComponent = STEP_COMPONENTS[currentStep + 1]
    import(`./steps/${NextComponent.name}`)
  }
}, [form.formState.isValid, currentStep])
```

### 5. Error Handling & Recovery

#### Auto-save with Conflict Resolution
```typescript
// Handle conflicts when user opens multiple tabs
const handleAutoSave = async (data: any) => {
  try {
    const result = await saveProgress(data)
    if (result.conflict) {
      // Show conflict resolution UI
      setConflictData(result.conflictData)
      setShowConflictModal(true)
    }
  } catch (error) {
    // Queue for retry
    addToRetryQueue(data)
  }
}
```

#### Offline Support
```typescript
// Service worker for offline onboarding
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}

// Queue form submissions when offline
const submitWithOfflineSupport = async (data: any) => {
  if (navigator.onLine) {
    return await submitOnboarding(data)
  } else {
    // Store in IndexedDB for later sync
    await storeOfflineSubmission(data)
    showOfflineMessage()
  }
}
```

---

## 📊 Performance Comparison

| Metric | State-Based | URL-Based | Server Integration |
|--------|-------------|-----------|-------------------|
| **Initial Load** | 🟢 Fast | 🟡 Medium | 🟢 Fast |
| **Step Navigation** | 🟢 Instant | 🟡 Network | 🔴 Network |
| **Form Validation** | 🟢 Client | 🟢 Client | 🟡 Server |
| **Data Persistence** | 🟡 localStorage | 🟡 localStorage | 🟢 Database |
| **Bundle Size** | 🟢 Small | 🟡 Medium | 🟢 Small |
| **JavaScript Required** | 🔴 Yes | 🔴 Yes | 🟢 No |
| **SEO Score** | 🔴 Poor | 🟡 Medium | 🟢 Excellent |
| **Accessibility** | 🟡 Medium | 🟡 Medium | 🟢 Excellent |

---

## 🛠 Implementation Checklist

### For State-Based Approach
- [ ] Set up form validation with Zod
- [ ] Implement localStorage hooks
- [ ] Create step components
- [ ] Add progress indicator
- [ ] Handle mobile optimization
- [ ] Test refresh behavior
- [ ] Add error boundaries

### For URL-Based Approach  
- [ ] Set up dynamic routing
- [ ] Create middleware for step protection
- [ ] Implement progress tracking
- [ ] Add analytics integration
- [ ] Handle invalid URLs
- [ ] Test browser navigation
- [ ] Add loading states

### For Server Integration
- [ ] Set up server actions
- [ ] Create database schema
- [ ] Implement progressive enhancement
- [ ] Add SEO metadata
- [ ] Test without JavaScript
- [ ] Handle server errors
- [ ] Add offline support

---

## 🎯 Decision Framework

Use this framework to choose the right approach for your project:

### 1. Project Requirements Analysis
```
□ Simple onboarding (< 5 steps)              → State-Based
□ Complex workflow (> 5 steps)               → URL-Based  
□ SEO requirements                           → Server Integration
□ Accessibility critical                     → Server Integration
□ Mobile-first                               → State-Based
□ Analytics/tracking important               → URL-Based
□ Fast development needed                    → State-Based
□ Enterprise/compliance                      → Server Integration
```

### 2. Technical Constraints
```
□ Limited development time                   → State-Based
□ Team unfamiliar with advanced Next.js     → State-Based
□ Need offline support                       → Server Integration
□ High traffic expectations                  → URL-Based
□ Complex validation rules                   → Server Integration
```

### 3. User Experience Priorities
```
□ Fastest possible experience               → State-Based
□ Bookmarkable steps important              → URL-Based
□ Must work without JavaScript              → Server Integration
□ Browser navigation expected               → URL-Based
□ Mobile performance critical               → State-Based
```

This comprehensive guide should provide you with everything needed to implement any type of multi-step onboarding flow in future projects. Choose the approach that best fits your specific requirements and constraints.
