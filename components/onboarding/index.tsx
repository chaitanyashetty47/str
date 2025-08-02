'use client'

import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { TriangleAlert } from 'lucide-react'

import { completeOnboardingAction } from '@/actions/onboarding.action'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { OnboardingData, onboardingSchema, OnboardingFormKeysType } from '@/types/onboarding'
import { ONBOARDING_FORM_KEYS, ONBOARDING_STEPS } from './constants/onboarding-constants'

import BasicInfoStep from './steps/BasicInfoStep'
import BodyMetricsStep from './steps/BodyMetricsStep'
import MeasurementsStep from './steps/MeasurementsStep'
import ReviewStep from './steps/ReviewStep'
import StepperIndicator from './shared/stepper-indicator'

interface OnboardingWizardProps {
  userEmail: string
}

export default function OnboardingWizard({ userEmail }: OnboardingWizardProps) {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(1)
  const [erroredInputName, setErroredInputName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  
  // localStorage integration
  const [savedData, setSavedData] = useLocalStorage<Partial<OnboardingData>>('strentor_onboarding', {})
  const [savedStep, setSavedStep] = useLocalStorage<number>('strentor_onboarding_step', 1)

  const methods = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onTouched',
    defaultValues: {
      email: userEmail,
      weightUnit: 'KG',
      heightUnit: 'CM', 
      activityLevel: 'SEDENTARY',
      ...savedData // Load saved data
    }
  })

  const {
    trigger,
    handleSubmit,
    setError,
    formState: { errors },
  } = methods

  // Restore saved step on mount
  useEffect(() => {
    if (savedStep > 1 && savedStep <= ONBOARDING_STEPS.length) {
      setActiveStep(savedStep)
    }
  }, [savedStep])

  // Auto-save form data to localStorage (with debouncing)
  useEffect(() => {
    const subscription = methods.watch((data) => {
      // Only save if we have meaningful data (not just initial values)
      if (data.name || data.weight || data.height) {
        console.log('💾 Auto-saving form data:', data)
        setSavedData(data as Partial<OnboardingData>)
      }
    })
    return () => subscription.unsubscribe()
  }, [methods, setSavedData])

  // Save current step to localStorage
  useEffect(() => {
    setSavedStep(activeStep)
  }, [activeStep, setSavedStep])

  // Reset confirmation when leaving last step
  useEffect(() => {
    if (activeStep !== ONBOARDING_STEPS.length) {
      setIsConfirmed(false)
    }
  }, [activeStep])

  // Enhanced step validation following StepperForm.md pattern
  const handleNext = async () => {
    const fieldsToValidate = ONBOARDING_FORM_KEYS[activeStep as keyof typeof ONBOARDING_FORM_KEYS]
    const isStepValid = await trigger(fieldsToValidate as any, { shouldFocus: true })
    
    if (isStepValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    } else {
      toast.error('Please fix the errors before continuing')
    }
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleConfirmationChange = (confirmed: boolean) => {
    setIsConfirmed(confirmed)
  }

  // Enhanced error handling with automatic navigation
  const handleServerError = (errorKey: string, errorMessage: string) => {
    // Find which step contains the error field
    let erroredStep: number = 1
    for (const [key, value] of Object.entries(ONBOARDING_FORM_KEYS)) {
      if (value.includes(errorKey as never)) {
        erroredStep = Number(key)
        break
      }
    }

    // Navigate to error step and set error
    setActiveStep(erroredStep)
    setError(errorKey as OnboardingFormKeysType, {
      message: errorMessage,
    })
    setErroredInputName(errorKey)
  }

  const onSubmit = async (data: OnboardingData) => {
    if (!isConfirmed) {
      toast.error('Please confirm your information before submitting')
      return
    }

    setIsSubmitting(true)
    
    try {
      console.log('Submitting onboarding data:', data)
      
      const result = await completeOnboardingAction(data)
      
      if (result.success) {
        // Clear localStorage on success
        setSavedData({})
        setSavedStep(1)
        
        toast.success('Welcome to Strentor! Your profile is now complete.')
        router.push('/home1')
      } else {
        // Handle server errors with automatic navigation
        if (result.error) {
          // Check if it's a field-specific error
          const fieldMatch = result.error.match(/field:(\w+)/)
          if (fieldMatch) {
            const fieldName = fieldMatch[1]
            handleServerError(fieldName, result.error)
          } else {
            // General form error
            setError("root.formError", {
              message: result.error,
            })
          }
        } else {
          toast.error('Failed to complete onboarding')
        }
      }
    } catch (error) {
      console.error('Onboarding submission error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 1:
        return <BasicInfoStep />
      case 2:
        return <BodyMetricsStep />
      case 3:
        return <MeasurementsStep />
      case 4:
        return (
          <ReviewStep 
            onConfirmationChange={handleConfirmationChange}
            isConfirmed={isConfirmed}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-strentor-blue/10 via-white to-strentor-yellow/10">
      {/* Improved layout for larger screens */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-strentor-red to-strentor-orange rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-strentor-red to-strentor-orange bg-clip-text text-transparent">
                Strentor
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Let's set up your profile to get started on your fitness journey
            </p>
          </div>

          {/* Stepper Indicator */}
          <StepperIndicator 
            activeStep={activeStep}
            totalSteps={ONBOARDING_STEPS.length}
            className="mb-8"
          />

          {/* Form Error Alert */}
          {errors.root?.formError && (
            <Alert variant="destructive" className="mb-6">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Form Error</AlertTitle>
              <AlertDescription>{errors.root?.formError?.message}</AlertDescription>
            </Alert>
          )}

          {/* Main Form Card - Improved layout for larger screens */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12">
              <FormProvider {...methods}>
                <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  
                  {/* Step Content */}
                  <div className="min-h-[500px]">
                    {getStepContent(activeStep)}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-center space-x-[20px]">
                    <button
                      type="button"
                      className="w-[100px] px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleBack}
                      disabled={activeStep === 1}
                    >
                      Back
                    </button>
                    {activeStep === ONBOARDING_STEPS.length ? (
                      <button
                        type="submit"
                        className="w-[100px] px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="w-[100px] px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        onClick={handleNext}
                      >
                        Next
                      </button>
                    )}
                  </div>
                </form>
              </FormProvider>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-strentor-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Your progress is automatically saved
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 