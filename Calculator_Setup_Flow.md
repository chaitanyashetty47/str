# Calculator Setup Flow

## Overview
This document outlines how users interact with calculators in the Strentor app, including the onboarding data collection and the "Save as today's weight" feature.

## User Onboarding Data Collection

### Required Fields (Step 1)
- **Weight** - Current weight for tracking and calculations
- **Weight Unit** - KG (default) or LB for international users
- **Height** - Rarely changes, used across multiple calculators
- **Height Unit** - CM (default), INCHES, or FEET for international users  
- **Date of Birth** - For automatic age calculation
- **Gender** - MALE or FEMALE for gender-specific calculations
- **Activity Level** - Default: SEDENTARY, used for calorie calculations

### Optional Fields (Step 2)
- **Neck circumference** (cm) - For body fat calculations
- **Waist circumference** (cm) - For body fat calculations
- **Hip circumference** (cm) - For women's body fat calculations

## Calculator User Flows

### BMI Calculator Flow

1. **Load Calculator**
   ```typescript
   // Auto-fill with user profile data
   const latestWeight = await getLatestWeight(userId)
   const form = {
     weight: latestWeight?.weight || user.weight,
     height: user.height
   }
   ```

2. **User Interaction**
   - Form pre-filled with latest weight and profile height
   - User can edit any field
   - If weight is changed, show "Save as today's weight" checkbox

3. **Weight Change Detection**
   ```
   ┌─────────────────────────────┐
   │    🧮 BMI Calculator         │
   ├─────────────────────────────┤
   │ Weight (kg)                 │
   │ ┌─────────┐                 │
   │ │  68.0   │ ← Changed from 70.5
   │ └─────────┘                 │
   │ ⚠️ Weight changed            │
   │ ☑️ Save as today's weight   │
   │                             │
   │ Height (cm)                 │
   │ ┌─────────┐                 │
   │ │  175    │                 │
   │ └─────────┘                 │
   │                             │
   │ [Calculate BMI]             │
   └─────────────────────────────┘
   ```

4. **Calculation & Save**
   ```typescript
   async function calculateBMI(data: {
     weight: number,
     height: number,
     saveNewWeight?: boolean
   }) {
     // Calculate BMI
     const bmi = (data.weight / (data.height/100)**2)
     
     // Save calculator session
     await prisma.calculatorSession.create({
       data: {
         userId,
         calculator: "BMI",
         inputs: { weight: data.weight, height: data.height },
         result: bmi,
         resultUnit: "BMI score"
       }
     })
     
     // Optionally save new weight to WeightLog
     if (data.saveNewWeight) {
       await saveWeightToLog(userId, data.weight)
     }
     
     return bmi
   }
   ```

### Body Fat Calculator Flow

1. **Load Calculator**
   ```typescript
   // Check available profile data
   const profileData = {
     weight: latestWeight?.weight || user.weight, // ✅ Available
     age: calculateAge(user.dateOfBirth),         // ✅ Available
     gender: user.gender,                         // ✅ Available
     neck: user.neck,                             // ❓ May be null
     waist: user.waist                            // ❓ May be null
   }
   ```

2. **Missing Data Handling**
   ```
   ┌─────────────────────────────┐
   │  📏 Body Fat Calculator      │
   ├─────────────────────────────┤
   │ Weight: 70.5kg ✅           │
   │ Age: 27 years ✅            │
   │ Gender: Male ✅             │
   │                             │
   │ ⚠️ Missing measurements     │
   │                             │
   │ Neck (cm) *                 │
   │ ┌─────────┐                 │
   │ │  38     │                 │
   │ └─────────┘                 │
   │                             │
   │ Waist (cm) *                │
   │ ┌─────────┐                 │
   │ │  85     │                 │
   │ └─────────┘                 │
   │                             │
   │ ☐ Save to profile           │
   │ ☐ Save weight as today's    │
   │                             │
   │ [Calculate Body Fat]        │
   └─────────────────────────────┘
   ```

3. **Multi-Save Options**
   - Save new measurements to profile for future use
   - Save updated weight to daily log
   - Both actions are optional and user-controlled

## Weight Logging Logic

### Save New Weight Function
```typescript
async function saveWeightToLog(userId: string, weight: number) {
  const today = new Date().toISOString().split('T')[0]
  
  // Check if user already logged weight today
  const existingEntry = await prisma.weightLog.findUnique({
    where: {
      userId_dateLogged: { userId, dateLogged: new Date(today) }
    }
  })
  
  if (existingEntry) {
    // Update existing entry
    await prisma.weightLog.update({
      where: { id: existingEntry.id },
      data: { weight }
    })
  } else {
    // Create new entry
    await prisma.weightLog.create({
      data: { userId, weight, dateLogged: new Date(today) }
    })
  }
}
```

## Benefits

### 1. Seamless User Experience
- Calculators pre-filled with profile data
- No need to re-enter basic information
- Optional weight logging for convenience

### 2. Data Consistency
- Weight tracking separated from calculations
- No cascade update issues
- Fresh calculations every time

### 3. Flexibility
- Users can use calculators with any values
- "What if" scenarios without affecting tracked data
- Progressive profile completion

### 4. Smart Defaults
- Activity level defaults to SEDENTARY
- Optional measurements don't block functionality
- Calculators work with available data

## Technical Implementation

### Database Structure
- **User Profile**: Stores onboarding data (weight, height, DOB, gender, etc.)
- **WeightLog**: Daily weight tracking for trends/graphs
- **CalculatorSession**: Optional history of calculations performed

### Calculator Types
```typescript
enum CalculatorType {
  BMI              // weight + height
  BMR              // weight + height + age + gender + activity
  BODY_FAT         // weight + neck + waist + age + gender
  CALORIE_NEEDS    // BMR + activity level
  IDEAL_WEIGHT     // height + age + gender
  LEAN_BODY_MASS   // weight + body fat percentage
  ONE_REP_MAX      // current weight + reps performed
  MACRO_SPLIT      // calorie needs + goals
}
```

This flow ensures maximum convenience while maintaining data integrity and user control over their information. 