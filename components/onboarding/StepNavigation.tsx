import { Button } from '@/components/ui/button'

interface StepNavigationProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  isSubmitting: boolean
  isLastStep: boolean
  isConfirmed?: boolean
}

export default function StepNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  isSubmitting,
  isLastStep,
  isConfirmed = true
}: StepNavigationProps) {
  const isSubmitDisabled = isLastStep && (!isConfirmed || isSubmitting)

  return (
    <div className="flex justify-between items-center pt-8 border-t border-gray-200 mt-8">
      {/* Previous Button */}
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className={`
          min-w-[120px] transition-all duration-200
          ${currentStep === 1 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-strentor-red hover:text-strentor-red'
          }
        `}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </Button>
      
      {/* Step Indicator */}
      <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
        <span>Step {currentStep} of {totalSteps}</span>
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-strentor-red to-strentor-orange h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Next/Submit Button */}
      {isLastStep ? (
        <div className="flex flex-col items-end gap-2">
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className={`
              min-w-[120px] bg-gradient-to-r from-strentor-red to-strentor-orange 
              hover:from-strentor-red/90 hover:to-strentor-orange/90 
              text-white font-semibold transition-all duration-200 shadow-lg
              ${isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:scale-105'}
            `}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Setting up...
              </>
            ) : (
              <>
                Complete Setup
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </Button>
          {!isConfirmed && !isSubmitting && (
            <p className="text-xs text-gray-500 text-center">
              Please confirm your information above
            </p>
          )}
        </div>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          className={`
            min-w-[120px] bg-gradient-to-r from-strentor-red to-strentor-orange 
            hover:from-strentor-red/90 hover:to-strentor-orange/90 
            text-white font-semibold transition-all duration-200 shadow-lg
            hover:shadow-xl hover:scale-105
          `}
        >
          Next
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      )}
    </div>
  )
} 