import { useFormContext } from 'react-hook-form'
import { OnboardingData } from '@/types/onboarding'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'

interface ReviewStepProps {
  onConfirmationChange: (confirmed: boolean) => void
  isConfirmed: boolean
}

export default function ReviewStep({ onConfirmationChange, isConfirmed }: ReviewStepProps) {
  const { watch } = useFormContext<OnboardingData>()
  const data = watch()
  
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

  const formatDateOfBirth = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "dd/MM/yyyy")
    } catch {
      return dateString
    }
  }

  const formatActivityLevel = (level: string) => {
    return level?.replace('_', ' ')?.toLowerCase()?.replace(/\b\w/g, l => l.toUpperCase())
  }

  const hasMeasurements = data.neck || data.waist || data.hips

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Review Your Information
        </h2>
        <p className="text-gray-600">
          Please review your details before completing setup
        </p>
      </div>

      <div className="grid gap-6">
        {/* Personal Information */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-strentor-red/5 to-strentor-orange/5">
            <CardTitle className="text-lg flex items-center gap-2">
              👤 Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Name:</span>
                <span className="font-semibold">{data.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="font-semibold text-sm">{data.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Date of Birth:</span>
                <span className="font-semibold">
                  {data.dateOfBirth ? formatDateOfBirth(data.dateOfBirth) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Age:</span>
                <span className="font-semibold">
                  {data.dateOfBirth ? calculateAge(data.dateOfBirth) : 'N/A'} years
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Gender:</span>
                <span className="font-semibold">{data.gender}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Body Metrics */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-strentor-blue/5 to-strentor-green/5">
            <CardTitle className="text-lg flex items-center gap-2">
              📊 Body Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Weight:</span>
                <span className="font-semibold">
                  {data.weight} {data.weightUnit?.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Height:</span>
                <span className="font-semibold">
                  {data.height} {data.heightUnit?.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between md:col-span-2">
                <span className="text-gray-600 font-medium">Activity Level:</span>
                <span className="font-semibold">
                  {formatActivityLevel(data.activityLevel || '')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Body Measurements (if provided) */}
        {hasMeasurements && (
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-strentor-purple/5 to-strentor-blue/5">
              <CardTitle className="text-lg flex items-center gap-2">
                📏 Body Measurements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.neck && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Neck:</span>
                    <span className="font-semibold">{data.neck} cm</span>
                  </div>
                )}
                {data.waist && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Waist:</span>
                    <span className="font-semibold">{data.waist} cm</span>
                  </div>
                )}
                {data.hips && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Hips:</span>
                    <span className="font-semibold">{data.hips} cm</span>
                  </div>
                )}
              </div>
              {(!data.neck || !data.waist || !data.hips) && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  💡 Missing measurements can be added later for advanced calculators
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Confirmation */}
        <Card className="border-2 border-strentor-orange/30 bg-strentor-orange/5">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="confirmation"
                checked={isConfirmed}
                onCheckedChange={onConfirmationChange}
                className="mt-1"
              />
              <Label htmlFor="confirmation" className="text-sm leading-relaxed cursor-pointer">
                I confirm that the information above is accurate and I'm ready to complete my Strentor profile setup. 
                I understand that I can update my measurements and preferences later in my profile settings.
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="border-2 border-strentor-green/30 bg-gradient-to-r from-strentor-green/5 to-strentor-yellow/5">
          <CardHeader>
            <CardTitle className="text-lg text-strentor-green flex items-center gap-2">
              🚀 What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-strentor-green">✅</span>
                <span className="text-sm">Access to personalized calculators</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-strentor-green">✅</span>
                <span className="text-sm">Track your fitness progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-strentor-green">✅</span>
                <span className="text-sm">Follow customized workout plans</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-strentor-green">✅</span>
                <span className="text-sm">Connect with fitness community</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-strentor-green">✅</span>
                <span className="text-sm">Join our fitness community</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-strentor-green">✅</span>
                <span className="text-sm">Access premium features</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 