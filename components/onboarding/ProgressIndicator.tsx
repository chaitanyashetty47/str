interface ProgressIndicatorProps {
  steps: { id: number; title: string; description: string }[]
  currentStep: number
  className?: string
}

export default function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  return (
    <div className={className}>
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all duration-300
              ${currentStep >= step.id 
                ? 'bg-strentor-red text-white shadow-lg scale-110' 
                : currentStep === step.id - 1
                ? 'bg-strentor-orange text-white'
                : 'bg-gray-200 text-gray-600'
              }
            `}>
              {currentStep > step.id ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                step.id
              )}
            </div>
            
            {/* Step Line (except for last step) */}
            {index < steps.length - 1 && (
              <div className={`
                h-1 flex-1 mx-4 rounded-full transition-all duration-500
                ${currentStep > step.id 
                  ? 'bg-gradient-to-r from-strentor-red to-strentor-orange' 
                  : 'bg-gray-200'
                }
              `} />
            )}
          </div>
        ))}
      </div>
      
      {/* Current Step Info */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {steps[currentStep - 1]?.title}
        </h3>
        <p className="text-gray-600">
          {steps[currentStep - 1]?.description}
        </p>
        
        {/* Step Counter */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of {steps.length}
          </span>
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index + 1 <= currentStep ? 'bg-strentor-red' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 