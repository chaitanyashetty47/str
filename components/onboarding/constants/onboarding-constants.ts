export const ONBOARDING_FORM_KEYS = {
  1: ["name", "email"] as const,
  2: ["weight", "weightUnit", "height", "heightUnit", "dateOfBirth", "gender", "activityLevel"] as const,
  3: ["neck", "waist", "hips"] as const,
  4: [] as const, // Review step - no new fields
} as const;

export const ONBOARDING_STEPS = [
  { id: 1, title: 'Basic Information', description: 'Tell us about yourself' },
  { id: 2, title: 'Body Metrics', description: 'Your fitness baseline' },
  { id: 3, title: 'Body Measurements', description: 'Optional measurements' },
  { id: 4, title: 'Review & Complete', description: 'Confirm your details' }
] as const; 