import { UseFormReturn } from 'react-hook-form'
import { OnboardingData } from '@/types/onboarding'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MeasurementsStepProps {
  form: UseFormReturn<OnboardingData>
}

export default function MeasurementsStep({ form }: MeasurementsStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Body Measurements
        </h2>
        <p className="text-gray-600">
          These optional measurements help us provide more accurate body composition calculations
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
            ℹ️ Optional Step
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-blue-700">
            You can skip these measurements and add them later. They're used for advanced calculators like body fat percentage.
          </p>
        </CardContent>
      </Card>

      {/* Measurements */}
      <div className="space-y-6">
        {/* Neck */}
        <div className="space-y-2">
          <Label htmlFor="neck" className="text-sm font-medium text-gray-700">
            Neck Circumference (cm)
          </Label>
          <Input
            {...form.register('neck')}
            id="neck"
            type="number"
            step="0.1"
            placeholder="e.g., 38.5"
            className="w-full md:w-1/2"
          />
          <p className="text-xs text-gray-500">
            Measure around the base of your neck
          </p>
          {form.formState.errors.neck && (
            <p className="text-strentor-red text-sm">
              {form.formState.errors.neck.message}
            </p>
          )}
        </div>

        {/* Waist */}
        <div className="space-y-2">
          <Label htmlFor="waist" className="text-sm font-medium text-gray-700">
            Waist Circumference (cm)
          </Label>
          <Input
            {...form.register('waist')}
            id="waist"
            type="number"
            step="0.1"
            placeholder="e.g., 85.0"
            className="w-full md:w-1/2"
          />
          <p className="text-xs text-gray-500">
            Measure around your natural waistline
          </p>
          {form.formState.errors.waist && (
            <p className="text-strentor-red text-sm">
              {form.formState.errors.waist.message}
            </p>
          )}
        </div>

        {/* Hips */}
        <div className="space-y-2">
          <Label htmlFor="hips" className="text-sm font-medium text-gray-700">
            Hip Circumference (cm)
          </Label>
          <Input
            {...form.register('hips')}
            id="hips"
            type="number"
            step="0.1"
            placeholder="e.g., 95.0"
            className="w-full md:w-1/2"
          />
          <p className="text-xs text-gray-500">
            Measure around the widest part of your hips
          </p>
          {form.formState.errors.hips && (
            <p className="text-strentor-red text-sm">
              {form.formState.errors.hips.message}
            </p>
          )}
        </div>
      </div>

      {/* Measurement Tips */}
      <Card className="border-strentor-yellow/30 bg-strentor-yellow/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-strentor-orange flex items-center gap-2">
            💡 Measurement Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="text-sm text-gray-700 space-y-1">
            <p>• Use a flexible measuring tape</p>
            <p>• Measure over minimal clothing</p>
            <p>• Don't pull the tape too tight</p>
            <p>• Take measurements at the same time of day</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 