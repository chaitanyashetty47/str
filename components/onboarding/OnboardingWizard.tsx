'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { completeOnboardingAction } from '@/actions/onboarding.action'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { OnboardingData, onboardingSchema } from '@/types/onboarding'

import BasicInfoStep from './steps/BasicInfoStep'
import BodyMetricsStep from './steps/BodyMetricsStep'
import MeasurementsStep from './steps/MeasurementsStep'
import ReviewStep from './steps/ReviewStep'
import ProgressIndicator from './ProgressIndicator'
import StepNavigation from './StepNavigation'

const STEPS = [
  { id: 1, title: 'Basic Information', description: 'Tell us about yourself' },
  { id: 2, title: 'Body Metrics', description: 'Your fitness baseline' },
  { id: 3, title: 'Body Measurements', description: 'Optional measurements' },
  { id: 4, title: 'Review & Complete', description: 'Confirm your details' }
]

interface OnboardingWizardProps {
  userEmail: string
}

export default function OnboardingWizard({ userEmail }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  
  // localStorage integration
  const [savedData, setSavedData] = useLocalStorage<Partial<OnboardingData>>('strentor_onboarding', {})
  const [savedStep, setSavedStep] = useLocalStorage<number>('strentor_onboarding_step', 1)

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      email: userEmail,
      weightUnit: 'KG',
      heightUnit: 'CM', 
      activityLevel: 'SEDENTARY',
      ...savedData // Load saved data
    }
  })

  // Restore saved step on mount
  useEffect(() => {
    if (savedStep > 1 && savedStep <= STEPS.length) {
      setCurrentStep(savedStep)
    }
  }, [savedStep])

  // Auto-save form data to localStorage (with debouncing)
  useEffect(() => {
    const subscription = form.watch((data) => {
      // Only save if we have meaningful data (not just initial values)
      if (data.name || data.weight || data.height) {
        console.log('💾 Auto-saving form data:', data)
        setSavedData(data as Partial<OnboardingData>)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, setSavedData])

  // Save current step to localStorage
  useEffect(() => {
    setSavedStep(currentStep)
  }, [currentStep, setSavedStep])

  // Reset confirmation when leaving last step
  useEffect(() => {
    if (currentStep !== STEPS.length) {
      setIsConfirmed(false)
    }
  }, [currentStep])

  // Step validation configuration (added measurements step)
  const stepValidations = {
    1: ['name'] as const,
    2: ['weight', 'height', 'dateOfBirth', 'gender'] as const,
    3: [] as const, // Measurements are optional
    4: [] as const
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

  const handleConfirmationChange = (confirmed: boolean) => {
    setIsConfirmed(confirmed)
  }

  const handleSubmit = async (data: OnboardingData) => {
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
        return <MeasurementsStep form={form} />
      case 4:
        return (
          <ReviewStep 
            form={form} 
            onConfirmationChange={handleConfirmationChange}
            isConfirmed={isConfirmed}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-strentor-blue/10 via-white to-strentor-yellow/10 flex items-center justify-center py-8">
      <div className="w-full max-w-4xl mx-auto px-4">
          
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

          {/* Progress Indicator */}
          <ProgressIndicator 
            steps={STEPS}
            currentStep={currentStep}
            className="mb-8"
          />

          {/* Main Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                
                {/* Step Content */}
                <div className="min-h-[500px]">
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
                  isConfirmed={isConfirmed}
                />
              </form>
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
    )
  } 