import { useFormContext, Controller } from 'react-hook-form'
import { useState } from 'react'
import { OnboardingData } from '@/types/onboarding'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CountryDropdown } from '@/components/ui/country-dropdown'
import { PhoneInput, type CountryData } from '@/components/ui/phone-input'
import { lookup } from 'country-data-list'

export default function BasicInfoStep() {
  const {
    register,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<OnboardingData>()

  const [selectedCountry, setSelectedCountry] = useState<CountryData | undefined>(undefined)
  const [countryDropdownData, setCountryDropdownData] = useState<any>(undefined)

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
          {...register('name')}
          id="name"
          placeholder="Enter your full name"
          className="w-full"
        />
        {errors.name && (
          <p className="text-strentor-red text-sm">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Email Display (Read-only) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input
          value={watch('email') || 'Loading...'}
          disabled
          className="bg-gray-50 text-gray-600"
        />
        <p className="text-xs text-gray-500">
          This is the email you used to sign up
        </p>
      </div>

      {/* Country Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Country *
        </Label>
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <CountryDropdown
              defaultValue={field.value}
              onChange={(country) => {
                field.onChange(country.alpha3)
                setCountryDropdownData(country)
                
                // Convert to CountryData format for PhoneInput
                const countryData: CountryData = {
                  alpha2: country.alpha2,
                  alpha3: country.alpha3,
                  countryCallingCodes: country.countryCallingCodes,
                  currencies: country.currencies,
                  emoji: country.emoji,
                  ioc: country.ioc,
                  languages: country.languages,
                  name: country.name,
                  status: country.status
                }
                setSelectedCountry(countryData)
                
                // Auto-set phone country code
                if (country.countryCallingCodes?.[0]) {
                  setValue('phone', country.countryCallingCodes[0])
                }
              }}
              placeholder="Select your country"
            />
          )}
        />
        {errors.country && (
          <p className="text-strentor-red text-sm">
            {errors.country.message}
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Phone Number <span className="text-gray-400">(Optional)</span>
        </Label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              {...field}
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value)}
              defaultCountry={selectedCountry?.alpha2?.toLowerCase()}
              onCountryChange={(countryData) => {
                // Update selected country if phone number changes country
                if (countryData && countryData.alpha3 !== selectedCountry?.alpha3) {
                  setSelectedCountry(countryData)
                  setValue('country', countryData.alpha3)
                }
              }}
              placeholder="Enter your phone number"
            />
          )}
        />
        {errors.phone && (
          <p className="text-strentor-red text-sm">
            {errors.phone.message}
          </p>
        )}
        <p className="text-xs text-gray-500">
          International format recommended (e.g., +1234567890)
        </p>
      </div>
    </div>
  )
} 