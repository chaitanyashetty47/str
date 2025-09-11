import { useFormContext } from 'react-hook-form'
import { OnboardingData } from '@/types/onboarding'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

// Helper function to convert inches to cm
function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

// Helper function to get measurement validation
function getMeasurementValidation(value: number, fieldName: string) {
  if (!value || value <= 0) return null;
  
  const ranges = {
    neck: { min: 25, max: 60, name: "Neck" },
    waist: { min: 50, max: 150, name: "Waist" },
    hips: { min: 70, max: 150, name: "Hips" },
  };
  
  const range = ranges[fieldName as keyof typeof ranges];
  if (!range) return null;
  
  if (value < range.min) {
    const inchesValue = Math.round(value / 2.54 * 10) / 10;
    return {
      type: "error" as const,
      message: `${range.name} measurement seems too small (${value}cm). Did you mean ${inchesValue} inches? That would be ${inchesToCm(inchesValue)}cm.`,
      suggestion: `Try ${inchesToCm(inchesValue)}cm instead.`
    };
  }
  
  // Warning thresholds based on new realistic ranges
  if (value < range.min + 10) {
    return {
      type: "warning" as const,
      message: `${range.name} measurement seems small (${value}cm). Please double-check. You can proceed with it.`,
      suggestion: null
    };
  }
  
  if (value > range.max) {
    return {
      type: "error" as const,
      message: `${range.name} measurement seems too large (${value}cm). Please check your measurement.`,
      suggestion: null
    };
  }
  
  return {
    type: "success" as const,
    message: `${range.name} measurement looks good!`,
    suggestion: null
  };
}

export default function MeasurementsStep() {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<OnboardingData>()

  // Validation state for measurements
  const [validationMessages, setValidationMessages] = useState<{
    [key: string]: { type: 'error' | 'warning' | 'success'; message: string; suggestion: string | null } | null;
  }>({});

  // Watch for changes in measurement fields
  const neckValue = watch('neck');
  const waistValue = watch('waist');
  const hipsValue = watch('hips');

  // Update validation messages when values change
  const updateValidation = (field: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      const validation = getMeasurementValidation(numValue, field);
      setValidationMessages(prev => ({
        ...prev,
        [field]: validation
      }));
    } else {
      setValidationMessages(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

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
            {...register('neck')}
            id="neck"
            type="number"
            step="0.1"
            placeholder="e.g., 35.0"
            className={`w-full md:w-1/2 ${
              validationMessages.neck?.type === 'error' ? 'border-red-500' : 
              validationMessages.neck?.type === 'warning' ? 'border-yellow-500' : 
              validationMessages.neck?.type === 'success' ? 'border-green-500' : ''
            }`}
            onChange={(e) => updateValidation('neck', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Measure around the base of your neck
          </p>
          {errors.neck && (
            <p className="text-strentor-red text-sm">
              {errors.neck.message}
            </p>
          )}
          {validationMessages.neck && (
            <div className={`text-sm p-2 rounded-md ${
              validationMessages.neck?.type === 'error' ? 'text-red-700 bg-red-50 border border-red-200' :
              validationMessages.neck?.type === 'warning' ? 'text-yellow-700 bg-yellow-50 border border-yellow-200' :
              'text-green-700 bg-green-50 border border-green-200'
            }`}>
              <p>{validationMessages.neck.message}</p>
              {validationMessages.neck.suggestion && (
                <p className="font-medium mt-1">{validationMessages.neck.suggestion}</p>
              )}
            </div>
          )}
        </div>

        {/* Waist */}
        <div className="space-y-2">
          <Label htmlFor="waist" className="text-sm font-medium text-gray-700">
            Waist Circumference (cm)
          </Label>
          <Input
            {...register('waist')}
            id="waist"
            type="number"
            step="0.1"
            placeholder="e.g., 75.0"
            className={`w-full md:w-1/2 ${
              validationMessages.waist?.type === 'error' ? 'border-red-500' : 
              validationMessages.waist?.type === 'warning' ? 'border-yellow-500' : 
              validationMessages.waist?.type === 'success' ? 'border-green-500' : ''
            }`}
            onChange={(e) => updateValidation('waist', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Measure around your natural waistline
          </p>
          {errors.waist && (
            <p className="text-strentor-red text-sm">
              {errors.waist.message}
            </p>
          )}
          {validationMessages.waist && (
            <div className={`text-sm p-2 rounded-md ${
              validationMessages.waist?.type === 'error' ? 'text-red-700 bg-red-50 border border-red-200' :
              validationMessages.waist?.type === 'warning' ? 'text-yellow-700 bg-yellow-50 border border-yellow-200' :
              'text-green-700 bg-green-50 border border-green-200'
            }`}>
              <p>{validationMessages.waist.message}</p>
              {validationMessages.waist.suggestion && (
                <p className="font-medium mt-1">{validationMessages.waist.suggestion}</p>
              )}
            </div>
          )}
        </div>

        {/* Hips */}
        <div className="space-y-2">
          <Label htmlFor="hips" className="text-sm font-medium text-gray-700">
            Hip Circumference (cm)
          </Label>
          <Input
            {...register('hips')}
            id="hips"
            type="number"
            step="0.1"
            placeholder="e.g., 90.0"
            className={`w-full md:w-1/2 ${
              validationMessages.hips?.type === 'error' ? 'border-red-500' : 
              validationMessages.hips?.type === 'warning' ? 'border-yellow-500' : 
              validationMessages.hips?.type === 'success' ? 'border-green-500' : ''
            }`}
            onChange={(e) => updateValidation('hips', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Measure around the widest part of your hips
          </p>
          {errors.hips && (
            <p className="text-strentor-red text-sm">
              {errors.hips.message}
            </p>
          )}
          {validationMessages.hips && (
            <div className={`text-sm p-2 rounded-md ${
              validationMessages.hips?.type === 'error' ? 'text-red-700 bg-red-50 border border-red-200' :
              validationMessages.hips?.type === 'warning' ? 'text-yellow-700 bg-yellow-50 border border-yellow-200' :
              'text-green-700 bg-green-50 border border-green-200'
            }`}>
              <p>{validationMessages.hips.message}</p>
              {validationMessages.hips.suggestion && (
                <p className="font-medium mt-1">{validationMessages.hips.suggestion}</p>
              )}
            </div>
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