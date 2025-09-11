import { useFormContext, Controller } from 'react-hook-form'
import { OnboardingData } from '@/types/onboarding'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DatePickerForm } from '@/components/ui/date-picker'

export default function BodyMetricsStep() {
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<OnboardingData>()

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
      <div className="space-y-2">
        <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
          Current Weight (kg) *
        </Label>
        <Input
          {...register('weight')}
          id="weight"
          type="number"
          step="0.1"
          placeholder="70"
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Enter your weight in kilograms
        </p>
        {errors.weight && (
          <p className="text-strentor-red text-sm">
            {errors.weight.message}
          </p>
        )}
      </div>

      {/* Height */}
      <div className="space-y-2">
        <Label htmlFor="height" className="text-sm font-medium text-gray-700">
          Height (cm) *
        </Label>
        <Input
          {...register('height')}
          id="height"
          type="number"
          step="0.1"
          placeholder="175"
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Enter your height in centimeters
        </p>
        {errors.height && (
          <p className="text-strentor-red text-sm">
            {errors.height.message}
          </p>
        )}
      </div>

      {/* Date of Birth */}
      <Controller
        name="dateOfBirth"
        control={control}
        rules={{ required: "Date of birth is required" }}
        render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
          <DatePickerForm
            label="Date of Birth"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            error={error?.message}
            required
            placeholder="Select your date of birth"
          />
        )}
      />

      {/* Gender */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Gender *
        </Label>
        <RadioGroup
          value={watch('gender')}
          onValueChange={(value) => setValue('gender', value as 'MALE' | 'FEMALE')}
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
        {errors.gender && (
          <p className="text-strentor-red text-sm">
            {errors.gender.message}
          </p>
        )}
      </div>

      {/* Activity Level */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Activity Level
        </Label>
        <Controller
          name="activityLevel"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
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
          )}
        />
        <p className="text-xs text-gray-500">
          This helps us calculate your calorie needs accurately
        </p>
      </div>
    </div>
  )
} 