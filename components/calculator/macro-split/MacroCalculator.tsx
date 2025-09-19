"use client";

import { useState } from "react";
import { Gender, ActivityLevel } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, Target, Zap, Activity, Scale, User, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MacroCalculatorProps {
  height: number;
  gender: Gender;
  weight: number;
  age: number;
  activityLevel: ActivityLevel;
}

type FitnessGoal = "weight_loss" | "maintenance" | "weight_gain";

interface MacroBreakdown {
  calories: number;
  protein: {
    grams: number;
    calories: number;
    percentage: number;
  };
  carbs: {
    grams: number;
    calories: number;
    percentage: number;
  };
  fats: {
    grams: number;
    calories: number;
    percentage: number;
  };
}

export function MacroCalculator({ 
  height, 
  gender, 
  weight,
  age,
  activityLevel 
}: MacroCalculatorProps) {
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>("maintenance");
  const [showInfo, setShowInfo] = useState(false);

  // Calculate BMR using Mifflin-St Jeor Equation
  function calculateBMR(height: number, weight: number, age: number, gender: Gender): number {
    if (gender === Gender.MALE) {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  }

  // Activity level multipliers
  const activityMultipliers = {
    SEDENTARY: 1.2,
    LIGHTLY_ACTIVE: 1.375,
    MODERATELY_ACTIVE: 1.55,
    VERY_ACTIVE: 1.725,
    EXTRA_ACTIVE: 1.9
  };

  // Calculate TDEE (Total Daily Energy Expenditure)
  function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    return bmr * activityMultipliers[activityLevel];
  }

  // Calculate goal-based calories
  function calculateGoalCalories(tdee: number, goal: FitnessGoal): number {
    switch (goal) {
      case "weight_loss":
        return tdee - 500; // 1 lb per week loss
      case "weight_gain":
        return tdee + 500; // 1 lb per week gain
      case "maintenance":
      default:
        return tdee;
    }
  }

  // Calculate macro distribution
  function calculateMacros(calories: number, goal: FitnessGoal): MacroBreakdown {
    let proteinPercent: number;
    let carbsPercent: number;
    let fatsPercent: number;

    switch (goal) {
      case "weight_loss":
        proteinPercent = 0.30; // 30%
        carbsPercent = 0.40;   // 40%
        fatsPercent = 0.30;    // 30%
        break;
      case "weight_gain":
        proteinPercent = 0.20; // 20%
        carbsPercent = 0.55;   // 55%
        fatsPercent = 0.25;    // 25%
        break;
      case "maintenance":
      default:
        proteinPercent = 0.25; // 25%
        carbsPercent = 0.45;   // 45%
        fatsPercent = 0.30;    // 30%
        break;
    }

    const proteinCalories = calories * proteinPercent;
    const carbsCalories = calories * carbsPercent;
    const fatsCalories = calories * fatsPercent;

    return {
      calories,
      protein: {
        grams: proteinCalories / 4, // 4 calories per gram
        calories: proteinCalories,
        percentage: proteinPercent * 100
      },
      carbs: {
        grams: carbsCalories / 4, // 4 calories per gram
        calories: carbsCalories,
        percentage: carbsPercent * 100
      },
      fats: {
        grams: fatsCalories / 9, // 9 calories per gram
        calories: fatsCalories,
        percentage: fatsPercent * 100
      }
    };
  }

  const bmr = calculateBMR(height, weight, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const goalCalories = calculateGoalCalories(tdee, fitnessGoal);
  const macros = calculateMacros(goalCalories, fitnessGoal);

  const getActivityLevelName = (level: ActivityLevel): string => {
    switch (level) {
      case ActivityLevel.SEDENTARY: return "Sedentary";
      case ActivityLevel.LIGHTLY_ACTIVE: return "Lightly Active";
      case ActivityLevel.MODERATELY_ACTIVE: return "Moderately Active";
      case ActivityLevel.VERY_ACTIVE: return "Very Active";
      case ActivityLevel.EXTRA_ACTIVE: return "Extra Active";
      default: return "Unknown";
    }
  };

  const getGoalName = (goal: FitnessGoal): string => {
    switch (goal) {
      case "weight_loss": return "Weight Loss";
      case "maintenance": return "Weight Maintenance";
      case "weight_gain": return "Weight Gain";
      default: return "Unknown";
    }
  };

  const getGoalIcon = (goal: FitnessGoal) => {
    switch (goal) {
      case "weight_loss": return <TrendingDown className="w-4 h-4" />;
      case "maintenance": return <Minus className="w-4 h-4" />;
      case "weight_gain": return <TrendingUp className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Main Calculator */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Your Macro Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Data Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Height</span>
                </div>
                <span className="font-semibold">{height} cm</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Weight</span>
                </div>
                <span className="font-semibold">{weight} kg</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Age</span>
                </div>
                <span className="font-semibold">{age} years</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Activity</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {getActivityLevelName(activityLevel)}
                </Badge>
              </div>
            </div>

            {/* Fitness Goal Selection */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Select Your Goal:</div>
              <div className="flex flex-wrap gap-3">
                {(["weight_loss", "maintenance", "weight_gain"] as FitnessGoal[]).map((goal) => (
                  <Button
                    key={goal}
                    variant={fitnessGoal === goal ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFitnessGoal(goal)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-full transition-all hover:scale-105",
                      fitnessGoal === goal 
                        ? "bg-strentor-red hover:bg-strentor-red/80 text-white shadow-md" 
                        : "bg-white text-strentor-red hover:bg-strentor-red/10 border-strentor-red border-2"
                    )}
                  >
                    {getGoalIcon(goal)}
                    <span className="text-sm font-medium">{getGoalName(goal)}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Calorie Breakdown */}
            <div className="text-center p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {macros.calories.toFixed(0)} calories
              </div>
              <div className="text-sm text-purple-700">
                Daily Calorie Target ({getGoalName(fitnessGoal)})
              </div>
            </div>

            {/* Macro Breakdown */}
            <div className="space-y-4">
              <div className="text-center font-semibold text-gray-700">
                Daily Macro Targets
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {/* Protein */}
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {macros.protein.grams.toFixed(0)}g
                  </div>
                  <div className="text-xs text-red-700">Protein</div>
                  <div className="text-xs text-red-600">
                    {macros.protein.percentage.toFixed(0)}%
                  </div>
                </div>
                
                {/* Carbs */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {macros.carbs.grams.toFixed(0)}g
                  </div>
                  <div className="text-xs text-blue-700">Carbs</div>
                  <div className="text-xs text-blue-600">
                    {macros.carbs.percentage.toFixed(0)}%
                  </div>
                </div>
                
                {/* Fats */}
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {macros.fats.grams.toFixed(0)}g
                  </div>
                  <div className="text-xs text-green-700">Fats</div>
                  <div className="text-xs text-green-600">
                    {macros.fats.percentage.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* BMR and TDEE Info */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-600">BMR</div>
                <div className="text-lg font-bold text-gray-800">
                  {bmr.toFixed(0)} cal
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-600">TDEE</div>
                <div className="text-lg font-bold text-gray-800">
                  {tdee.toFixed(0)} cal
                </div>
              </div>
            </div>

            {/* Info Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setShowInfo(!showInfo)}
              className="w-full"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {showInfo ? "Hide" : "Show"} Calculation Details
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Macro Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              Your macros are calculated using the Mifflin-St Jeor equation for BMR and activity multipliers.
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-800 mb-1">BMR Formula:</div>
                <div className="text-sm text-blue-700">
                  Men: 10×Weight + 6.25×Height - 5×Age + 5<br/>
                  Women: 10×Weight + 6.25×Height - 5×Age - 161
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-800 mb-1">TDEE Calculation:</div>
                <div className="text-sm text-green-700">
                  TDEE = BMR × Activity Multiplier
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              * Weight in kg, Height in cm, Age in years
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Macro Distribution by Goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span><strong>Weight Loss:</strong> 30% Protein, 40% Carbs, 30% Fats</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-blue-500" />
                <span><strong>Maintenance:</strong> 25% Protein, 45% Carbs, 30% Fats</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span><strong>Weight Gain:</strong> 20% Protein, 55% Carbs, 25% Fats</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Macronutrient Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span><strong>Protein:</strong> 4 calories per gram - Builds and repairs muscle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span><strong>Carbs:</strong> 4 calories per gram - Primary energy source</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span><strong>Fats:</strong> 9 calories per gram - Hormone production and nutrient absorption</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              These ratios are optimized for your specific fitness goal and activity level.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}