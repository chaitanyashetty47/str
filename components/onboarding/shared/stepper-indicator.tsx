'use client'

import { Fragment } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface StepperIndicatorProps {
  activeStep: number
  totalSteps?: number
  className?: string
}

export default function StepperIndicator({ 
  activeStep, 
  totalSteps = 4,
  className 
}: StepperIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className={cn("flex justify-center items-center", className)}>
      {steps.map((step) => (
        <Fragment key={step}>
          <div
            className={cn(
              "w-[40px] h-[40px] flex justify-center items-center m-[5px] border-[2px] rounded-full transition-all duration-200",
              step < activeStep && "bg-primary text-white border-primary",
              step === activeStep && "border-primary text-primary bg-primary/10",
              step > activeStep && "border-gray-300 text-gray-400"
            )}
          >
            {step >= activeStep ? step : <Check className="h-5 w-5" />}
          </div>
          {step !== totalSteps && (
            <Separator
              orientation="horizontal"
              className={cn(
                "w-[100px] h-[2px] transition-all duration-200",
                step <= activeStep - 1 && "bg-primary",
                step > activeStep - 1 && "bg-gray-300"
              )}
            />
          )}
        </Fragment>
      ))}
    </div>
  )
} 