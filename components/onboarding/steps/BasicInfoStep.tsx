import { UseFormReturn } from 'react-hook-form'
import { OnboardingData } from '@/types/onboarding'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BasicInfoStepProps {
  form: UseFormReturn<OnboardingData>
}

export default function BasicInfoStep({ form }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Welcome to <span className="text-strentor-red">Strentor</span>!
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
          <p className="text-strentor-red text-sm">
            {form.formState.errors.name.message}
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
          className="bg-gray-50 text-gray-600"
        />
        <p className="text-xs text-gray-500">
          This is the email you used to sign up
        </p>
      </div>
    </div>
  )
} 