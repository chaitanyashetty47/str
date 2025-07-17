import { UseFormReturn } from 'react-hook-form'
import { OnboardingData } from '@/types/onboarding'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface BodyMetricsStepProps {
  form: UseFormReturn<OnboardingData>
}

export default function BodyMetricsStep({ form }: BodyMetricsStepProps) {
  const weightUnit = form.watch('weightUnit')
  const heightUnit = form.watch('heightUnit')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Body Metrics
        </h2>
        <p className="text-gray-600">
          This helps us personalize your fitness calculations
        </p>
      </div>

      {/* Weight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
            Current Weight *
          </Label>
          <Input
            {...form.register('weight')}
            id="weight"
            type="number"
            placeholder={weightUnit === 'KG' ? '70' : '154'}
            className="w-full"
          />
          {form.formState.errors.weight && (
            <p className="text-strentor-red text-sm">
              {form.formState.errors.weight.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Unit</Label>
          <Select
            value={weightUnit}
            onValueChange={(value) => form.setValue('weightUnit', value as 'KG' | 'LB')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KG">kg</SelectItem>
              <SelectItem value="LB">lbs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Height */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="height" className="text-sm font-medium text-gray-700">
            Height *
          </Label>
          <Input
            {...form.register('height')}
            id="height"
            type="number"
            placeholder={heightUnit === 'CM' ? '175' : '69'}
            className="w-full"
          />
          {form.formState.errors.height && (
            <p className="text-strentor-red text-sm">
              {form.formState.errors.height.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Unit</Label>
          <Select
            value={heightUnit}
            onValueChange={(value) => form.setValue('heightUnit', value as 'CM' | 'INCHES')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CM">cm</SelectItem>
              <SelectItem value="INCHES">inches</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
          Date of Birth *
        </Label>
        <Input
          {...form.register('dateOfBirth')}
          id="dateOfBirth"
          type="date"
          className="w-full md:w-1/2"
        />
        {form.formState.errors.dateOfBirth && (
          <p className="text-strentor-red text-sm">
            {form.formState.errors.dateOfBirth.message}
          </p>
        )}
      </div>

      {/* Gender */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Gender *
        </Label>
        <RadioGroup
          value={form.watch('gender')}
          onValueChange={(value) => form.setValue('gender', value as 'MALE' | 'FEMALE')}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="MALE" id="male" />
            <Label htmlFor="male" className="cursor-pointer">Male</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="FEMALE" id="female" />
            <Label htmlFor="female" className="cursor-pointer">Female</Label>
          </div>
        </RadioGroup>
        {form.formState.errors.gender && (
          <p className="text-strentor-red text-sm">
            {form.formState.errors.gender.message}
          </p>
        )}
      </div>

      {/* Activity Level */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Activity Level
        </Label>
        <Select
          value={form.watch('activityLevel')}
          onValueChange={(value) => form.setValue('activityLevel', value as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEDENTARY">
              <div>
                <div className="font-medium">Sedentary</div>
                <div className="text-sm text-gray-500">Little to no exercise</div>
              </div>
            </SelectItem>
            <SelectItem value="LIGHTLY_ACTIVE">
              <div>
                <div className="font-medium">Lightly Active</div>
                <div className="text-sm text-gray-500">Light exercise 1-3 days/week</div>
              </div>
            </SelectItem>
            <SelectItem value="MODERATELY_ACTIVE">
              <div>
                <div className="font-medium">Moderately Active</div>
                <div className="text-sm text-gray-500">Moderate exercise 3-5 days/week</div>
              </div>
            </SelectItem>
            <SelectItem value="VERY_ACTIVE">
              <div>
                <div className="font-medium">Very Active</div>
                <div className="text-sm text-gray-500">Hard exercise 6-7 days/week</div>
              </div>
            </SelectItem>
            <SelectItem value="EXTRA_ACTIVE">
              <div>
                <div className="font-medium">Extra Active</div>
                <div className="text-sm text-gray-500">Very hard exercise, 2x/day</div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          This helps us calculate your calorie needs accurately
        </p>
      </div>
    </div>
  )
} 