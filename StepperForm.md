# Building a Multi-Step Form with React Hook Form

This guide explains how to build a comprehensive multi-step form using React Hook Form, covering all components, types, validation, and state management.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Type Definitions](#type-definitions)
3. [Constants and Configuration](#constants-and-configuration)
4. [Main Form Component](#main-form-component)
5. [Step Components](#step-components)
6. [Stepper Indicator](#stepper-indicator)
7. [Form Validation](#form-validation)
8. [Error Handling](#error-handling)
9. [Key Concepts](#key-concepts)

## Project Structure

```
src/
├── app/
│   └── hook-multi-step/
│       └── page.tsx                 # Page wrapper
├── components/
│   ├── hook-multi-step/
│   │   ├── index.tsx                # Main form component
│   │   ├── address-info.tsx         # Step 2: Address
│   │   ├── applicant-info.tsx       # Step 1: Personal info
│   │   ├── employment-info.tsx      # Step 3: Employment
│   │   ├── financial-info.tsx       # Step 5: Financial
│   │   └── loan-details.tsx         # Step 4: Loan details
│   └── shared/
│       └── stepper-indicator/
│           └── index.tsx            # Progress indicator
├── lib/
│   ├── constants/
│   │   └── hook-stepper-constants.ts # Form field mappings
│   └── utils.ts                     # Validation utilities
└── types/
    └── hook-stepper.ts              # TypeScript types
```

## Type Definitions

### 1. Form Field Keys Type

```typescript
// src/types/hook-stepper.ts
import { STEPPER_FORM_KEYS } from "@/lib/constants/hook-stepper-constants";

export type StepperFormKeysType =
  (typeof STEPPER_FORM_KEYS)[keyof typeof STEPPER_FORM_KEYS][number];
```

**Explanation:**

- Extracts all field names from the constants object
- Uses TypeScript's advanced type manipulation:
  - `typeof STEPPER_FORM_KEYS` - Gets the object type
  - `keyof typeof STEPPER_FORM_KEYS` - Gets all keys ("1" | "2" | "3" | "4" | "5")
  - `[keyof typeof STEPPER_FORM_KEYS]` - Accesses array types for each step
  - `[number]` - Extracts individual string types from arrays

**Result:** Union of all field names:

```typescript
"fullName" |
  "dob" |
  "email" |
  "phone" |
  "address" |
  "city" |
  "state" |
  "zipCode" |
  "employmentStatus" |
  "employerName" |
  "jobTitle" |
  "annualIncome" |
  "loanAmount" |
  "loanPurpose" |
  "repaymentTerms" |
  "repaymentStartDate" |
  "bankName" |
  "accountNumber" |
  "routingNumber" |
  "creditScore";
```

### 2. Form Values Type

```typescript
export type StepperFormValues = {
  [FieldName in StepperFormKeysType]: FieldName extends
    | "annualIncome"
    | "loanAmount"
    | "repaymentTerms"
    | "creditScore"
    ? number
    : string;
};
```

**Explanation:**

- Creates a mapped type for all form fields
- Uses conditional typing to assign correct types:
  - **Number fields**: `annualIncome`, `loanAmount`, `repaymentTerms`, `creditScore`
  - **String fields**: Everything else
- Ensures type safety for form data

## Constants and Configuration

### Form Field Mappings

```typescript
// src/lib/constants/hook-stepper-constants.ts
export const STEPPER_FORM_KEYS = {
  1: ["fullName", "dob", "email", "phone"],
  2: ["address", "city", "state", "zipCode"],
  3: ["employmentStatus", "employerName", "jobTitle", "annualIncome"],
  4: ["loanAmount", "loanPurpose", "repaymentTerms", "repaymentStartDate"],
  5: ["bankName", "accountNumber", "routingNumber", "creditScore"],
} as const;
```

**Purpose:**

- Maps step numbers to field names
- Enables step-by-step validation
- Provides structure for error handling
- Used for automatic type generation

## Main Form Component

### Core Setup

```typescript
// src/components/hook-multi-step/index.tsx
const HookMultiStepForm = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [erroredInputName, setErroredInputName] = useState("");

  const methods = useForm<StepperFormValues>({
    mode: "onTouched",
  });

  const {
    trigger,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = methods;
```

**Key Features:**

- **`mode: "onTouched"`**: Validation triggers on first blur, then on every change
- **`trigger`**: Manual validation for specific fields or entire form
- **`setError`**: Manual error setting for server validation
- **State management**: Tracks current step and error focus

### Step Navigation

```typescript
const handleNext = async () => {
  const isStepValid = await trigger(undefined, { shouldFocus: true });
  if (isStepValid) setActiveStep((prevActiveStep) => prevActiveStep + 1);
};

const handleBack = () => {
  setActiveStep((prevActiveStep) => prevActiveStep - 1);
};
```

**Validation Flow:**

1. **`trigger(undefined)`**: Validates all fields in current step
2. **`shouldFocus: true`**: Focuses first error field if validation fails
3. **Step progression**: Only advances if validation passes

### Error Handling

```typescript
const onSubmit = async (formData: StepperFormValues) => {
  // Simulate API call
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      reject({
        message: "There was an error submitting form",
        errorKey: "fullName", // Optional: specific field error
      });
    }, 2000);
  })
    .then(({ title, description }) => {
      toast({ title, description });
    })
    .catch(({ message: errorMessage, errorKey }) => {
      if (
        errorKey &&
        Object.values(STEPPER_FORM_KEYS)
          .flatMap((fieldNames) => fieldNames)
          .includes(errorKey as never)
      ) {
        // Find which step contains the error field
        let erroredStep: number;
        for (const [key, value] of Object.entries(STEPPER_FORM_KEYS)) {
          if (value.includes(errorKey as never)) {
            erroredStep = Number(key);
          }
        }

        // Navigate to error step and set error
        setActiveStep(erroredStep);
        setError(errorKey as StepperFormKeysType, {
          message: errorMessage,
        });
        setErroredInputName(errorKey);
      } else {
        // General form error
        setError("root.formError", {
          message: errorMessage,
        });
      }
    });
};
```

**Error Handling Features:**

- **Field-specific errors**: Navigate to correct step and highlight field
- **General errors**: Show form-level error message
- **Automatic navigation**: Jump to step containing error field
- **Focus management**: Automatically focus error field

### Form Provider Setup

```typescript
return (
  <div>
    <StepperIndicator activeStep={activeStep} />
    {errors.root?.formError && (
      <Alert variant="destructive" className="mt-[28px]">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Form Error</AlertTitle>
        <AlertDescription>{errors.root?.formError?.message}</AlertDescription>
      </Alert>
    )}
    <FormProvider {...methods}>
      <form noValidate>
        {getStepContent(activeStep)}
        <div className="flex justify-center space-x-[20px]">
          <Button
            type="button"
            className="w-[100px]"
            variant="secondary"
            onClick={handleBack}
            disabled={activeStep === 1}
          >
            Back
          </Button>
          {activeStep === 5 ? (
            <Button
              className="w-[100px]"
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              Submit
            </Button>
          ) : (
            <Button type="button" className="w-[100px]" onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  </div>
);
```

**Key Elements:**

- **`FormProvider`**: Provides form methods to all child components
- **`noValidate`**: Disables browser validation, uses React Hook Form
- **Step content**: Dynamically renders current step component
- **Navigation buttons**: Back/Next/Submit based on current step

## Step Components

### 1. Basic Step (Address Info)

```typescript
// src/components/hook-multi-step/address-info.tsx
const AddressInfo = () => {
  const {
    formState: { errors },
    register,
  } = useFormContext<StepperFormValues>();

  return (
    <div>
      <h4 className="stepper_step_heading">Address Information</h4>
      <div className="stepper_step_container">
        <FloatingLabelInput
          id="currentAddress"
          label="Current Address"
          type="text"
          {...register("address", { required: "Required" })}
          error={errors.address?.message}
        />
        {/* More fields... */}
      </div>
    </div>
  );
};
```

**Features:**

- **`useFormContext()`**: Access form methods from parent
- **`register()`**: Standard field registration
- **Error display**: Shows validation errors inline

### 2. Step with Custom Components (Applicant Info)

```typescript
// src/components/hook-multi-step/applicant-info.tsx
const ApplicantInfo = () => {
  const {
    control,
    formState: { errors },
    register,
  } = useFormContext<StepperFormValues>();

  return (
    <div>
      <h4 className="stepper_step_heading">Applicant Information</h4>
      <div className="stepper_step_container">
        {/* Standard input */}
        <FloatingLabelInput
          id="fullName"
          label="Full name"
          {...register("fullName", { required: "Required" })}
          error={errors.fullName?.message}
        />

        {/* Custom component with Controller */}
        <Controller
          name="dob"
          control={control}
          rules={{ required: "Required" }}
          render={({
            field: { onChange, value, onBlur },
            fieldState: { invalid, error },
          }) => (
            <div>
              <DatePickerSingle
                placeholder="Pick a date"
                onSelect={onChange}
                selectedDate={value ? new Date(value) : null}
                onBlur={onBlur}
                floatingLabel="Date of birth"
              />
              {invalid && (
                <span className="text-destructive block !mt-[5px] text-[12px]">
                  {error?.message}
                </span>
              )}
            </div>
          )}
        />

        {/* Email with custom validation */}
        <FloatingLabelInput
          id="email"
          label="Email"
          type="email"
          {...register("email", {
            required: "Required",
            validate: validateEmail,
          })}
          error={errors.email?.message}
        />
      </div>
    </div>
  );
};
```

**Controller Usage:**

- **`name`**: Field name in form data
- **`control`**: Form control from context
- **`rules`**: Validation rules
- **`render`**: Custom render function with field props
- **`field`**: Contains `onChange`, `value`, `onBlur`
- **`fieldState`**: Contains `invalid`, `error`

### 3. Conditional Validation (Employment Info)

```typescript
// src/components/hook-multi-step/employment-info.tsx
const EmploymentInfo = () => {
  const {
    control,
    trigger,
    formState: { errors },
    register,
  } = useFormContext<StepperFormValues>();

  return (
    <div>
      <h4 className="stepper_step_heading">Employment Information</h4>
      <div className="stepper_step_container">
        {/* Select with trigger */}
        <Controller
          name="employmentStatus"
          rules={{ required: "Required" }}
          control={control}
          render={({
            field: { onChange, value, onBlur },
            fieldState: { invalid, error },
          }) => (
            <div>
              <Select
                onValueChange={(value) => {
                  onChange(value);
                  // Trigger validation for dependent fields
                  trigger(["employerName", "jobTitle", "annualIncome"]);
                }}
                value={value}
                onOpenChange={(value) => !value && onBlur()}
              >
                {/* Select content */}
              </Select>
            </div>
          )}
        />

        {/* Conditional validation */}
        <FloatingLabelInput
          id="employerName"
          label="Employer name"
          type="text"
          {...register("employerName", {
            validate: (employerName, formValues) => {
              if (
                (formValues.employmentStatus === "employed" ||
                  formValues.employmentStatus === "self-employed") &&
                !employerName
              ) {
                return "Required";
              }
            },
          })}
          error={errors.employerName?.message}
        />

        {/* Number field with valueAsNumber */}
        <FloatingLabelInput
          id="annualIncome"
          label="Annual income"
          type="number"
          {...register("annualIncome", {
            validate: (annualIncome, formValues) => {
              if (
                (formValues.employmentStatus === "employed" ||
                  formValues.employmentStatus === "self-employed") &&
                !annualIncome
              ) {
                return "Required";
              }
            },
            valueAsNumber: true, // Converts string to number
          })}
          error={errors.annualIncome?.message}
        />
      </div>
    </div>
  );
};
```

**Advanced Features:**

- **Conditional validation**: Fields required based on other field values
- **`trigger()`**: Manually trigger validation for dependent fields
- **`valueAsNumber`**: Convert string input to number
- **Cross-field validation**: Access entire form values in validation

## Stepper Indicator

```typescript
// src/components/shared/stepper-indicator/index.tsx
const StepperIndicator = ({ activeStep }: StepperIndicatorProps) => {
  return (
    <div className="flex justify-center items-center">
      {[1, 2, 3, 4, 5].map((step) => (
        <Fragment key={step}>
          <div
            className={clsx(
              "w-[40px] h-[40px] flex justify-center items-center m-[5px] border-[2px] rounded-full",
              step < activeStep && "bg-primary text-white",
              step === activeStep && "border-primary text-primary"
            )}
          >
            {step >= activeStep ? step : <Check className="h-5 w-5" />}
          </div>
          {step !== 5 && (
            <Separator
              orientation="horizontal"
              className={clsx(
                "w-[100px] h-[2px]",
                step <= activeStep - 1 && "bg-primary"
              )}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};
```

**Visual States:**

- **Completed steps**: Check icon with primary background
- **Current step**: Step number with primary border
- **Future steps**: Step number with default styling
- **Connectors**: Primary color for completed sections

## Form Validation

### Validation Modes

```typescript
const methods = useForm<StepperFormValues>({
  mode: "onTouched", // Validation strategy
});
```

**Available Modes:**

- **`onSubmit`** (default): Validate only on form submission
- **`onBlur`**: Validate when field loses focus
- **`onChange`**: Validate on every keystroke (performance impact)
- **`onTouched`**: First blur triggers validation, then every change
- **`all`**: Validate on both blur and change

### Custom Validation

```typescript
// src/lib/utils.ts
export const validateEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  if (email.length > 254) {
    return "Email is too long";
  }

  return undefined; // No error
};
```

**Validation Patterns:**

- **Return `undefined`**: No error
- **Return string**: Error message
- **Access form values**: Second parameter for cross-field validation

### Field Registration Patterns

```typescript
// Basic required field
{...register("fieldName", { required: "Required" })}

// With custom validation
{...register("email", {
  required: "Required",
  validate: validateEmail,
})}

// Number field
{...register("amount", {
  required: "Required",
  valueAsNumber: true,
})}

// Conditional validation
{...register("employerName", {
  validate: (value, formValues) => {
    if (formValues.employmentStatus === "employed" && !value) {
      return "Required for employed users";
    }
  },
})}
```

## Error Handling

### Client-Side Errors

```typescript
// Automatic validation errors
<FloatingLabelInput
  {...register("fieldName", { required: "Required" })}
  error={errors.fieldName?.message}
/>
```

### Server-Side Errors

```typescript
// Manual error setting
setError("fieldName", {
  type: "manual",
  message: "Server validation error",
});

// General form error
setError("root.formError", {
  message: "General form error",
});
```

### Error Navigation

```typescript
// Find step containing error field
for (const [key, value] of Object.entries(STEPPER_FORM_KEYS)) {
  if (value.includes(errorKey as never)) {
    erroredStep = Number(key);
  }
}

// Navigate and set error
setActiveStep(erroredStep);
setError(errorKey as StepperFormKeysType, {
  message: errorMessage,
});
```

## Key Concepts

### 1. FormProvider Pattern

```typescript
// Parent component
const methods = useForm<StepperFormValues>({ mode: "onTouched" });

return (
  <FormProvider {...methods}>
    <form noValidate>
      {/* Child components access form methods via useFormContext() */}
    </form>
  </FormProvider>
);
```

**Benefits:**

- Avoid prop drilling
- Clean component structure
- Consistent form state
- Easy access to form methods

### 2. Controller for Custom Components

```typescript
<Controller
  name="fieldName"
  control={control}
  rules={{ required: "Required" }}
  render={({ field, fieldState }) => (
    <CustomComponent
      onChange={field.onChange}
      value={field.value}
      onBlur={field.onBlur}
    />
  )}
/>
```

**When to use:**

- Custom input components
- Third-party components
- Components with custom APIs
- Date pickers, selects, etc.

### 3. Step-by-Step Validation

```typescript
const handleNext = async () => {
  const isStepValid = await trigger(undefined, { shouldFocus: true });
  if (isStepValid) setActiveStep((prevActiveStep) => prevActiveStep + 1);
};
```

**Flow:**

1. Validate current step fields
2. Focus first error field if validation fails
3. Only proceed if validation passes

### 4. Type Safety

```typescript
// Automatic type generation from constants
export type StepperFormKeysType =
  (typeof STEPPER_FORM_KEYS)[keyof typeof STEPPER_FORM_KEYS][number];

// Conditional typing for different field types
export type StepperFormValues = {
  [FieldName in StepperFormKeysType]: FieldName extends
    | "annualIncome"
    | "loanAmount"
    | "repaymentTerms"
    | "creditScore"
    ? number
    : string;
};
```

**Benefits:**

- Type-safe form data
- Automatic updates when constants change
- Prevents type mismatches
- Better IDE support

### 5. Error Management

```typescript
// Field-specific errors
setError("fieldName", { message: "Error message" });

// General form errors
setError("root.formError", { message: "General error" });

// Error navigation
setActiveStep(erroredStep);
setErroredInputName(errorKey);
```

**Features:**

- Automatic navigation to error fields
- Focus management
- Visual error indicators
- Server error handling

## Best Practices

1. **Use `FormProvider`** for multi-step forms
2. **Implement step validation** before navigation
3. **Handle server errors** with automatic navigation
4. **Use TypeScript** for type safety
5. **Separate concerns** with step components
6. **Implement proper error handling** for better UX
7. **Use conditional validation** for complex forms
8. **Optimize performance** with appropriate validation modes

This architecture provides a robust, type-safe, and user-friendly multi-step form experience with React Hook Form.
