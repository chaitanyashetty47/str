"use client";

import { useState } from "react";
import { Gender } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, TrendingDown, Scale, User, Calculator } from "lucide-react";

interface IdealWeightCalculatorProps {
  height: number;
  gender: Gender;
  currentWeight?: number | null;
}

export function IdealWeightCalculator({ 
  height, 
  gender, 
  currentWeight 
}: IdealWeightCalculatorProps) {
  const [showInfo, setShowInfo] = useState(false);

  // Calculate ideal weight using Miller formula
  function calculateIdealWeight(height: number, gender: Gender): number {
    if (gender === Gender.MALE) {
      return 56.2 + 0.555 * (height - 152.4);
    } else {
      return 53.1 + 0.535 * (height - 152.4);
    }
  }

  const idealWeight = calculateIdealWeight(height, gender);
  const weightDifference = currentWeight ? currentWeight - idealWeight : null;
  const needsToGain = weightDifference && weightDifference < 0;
  const needsToLose = weightDifference && weightDifference > 0;
  const isAtIdeal = weightDifference && Math.abs(weightDifference) <= 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Main Calculator */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Your Ideal Weight
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Height Display */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Height</span>
              </div>
              <span className="font-semibold">{height} cm</span>
            </div>

            {/* Gender Display */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Gender</span>
              </div>
              <Badge variant="secondary">
                {gender === Gender.MALE ? "Male" : "Female"}
              </Badge>
            </div>

            {/* Ideal Weight Result */}
            <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {idealWeight.toFixed(1)} kg
              </div>
              <div className="text-sm text-blue-700">
                Ideal Weight (Miller Formula)
              </div>
            </div>

            {/* Current Weight Comparison */}
            {currentWeight && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Current Weight</span>
                  </div>
                  <span className="font-semibold">{currentWeight} kg</span>
                </div>

                {/* Weight Difference */}
                <div className="text-center p-4 rounded-lg border-2">
                  {isAtIdeal ? (
                    <div className="text-green-600">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Target className="w-5 h-5" />
                        <span className="font-semibold">Perfect!</span>
                      </div>
                      <div className="text-sm">You're at your ideal weight</div>
                    </div>
                  ) : needsToGain ? (
                    <div className="text-orange-600">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-semibold">Gain Weight</span>
                      </div>
                      <div className="text-sm">
                        You need to gain <span className="font-semibold">{Math.abs(weightDifference).toFixed(1)} kg</span>
                      </div>
                    </div>
                  ) : needsToLose ? (
                    <div className="text-red-600">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingDown className="w-5 h-5" />
                        <span className="font-semibold">Lose Weight</span>
                      </div>
                      <div className="text-sm">
                        You need to lose <span className="font-semibold">{weightDifference.toFixed(1)} kg</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Info Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setShowInfo(!showInfo)}
              className="w-full"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {showInfo ? "Hide" : "Show"} Formula Details
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-600" />
              Miller Formula
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              The Miller formula (1983) is one of the most accurate methods for calculating ideal weight.
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-800 mb-1">For Men:</div>
                <div className="text-sm text-blue-700">
                  Ideal Weight = 56.2 + 0.555 × (Height - 152.4)
                </div>
              </div>

              <div className="p-3 bg-pink-50 rounded-lg">
                <div className="font-semibold text-pink-800 mb-1">For Women:</div>
                <div className="text-sm text-pink-700">
                  Ideal Weight = 53.1 + 0.535 × (Height - 152.4)
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              * Height is measured in centimeters
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Ideal Weight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              Ideal weight is a reference point for maintaining good health. It's calculated based on your height and gender.
            </p>
            <p>
              The Miller formula provides a more accurate estimate compared to simple height-weight ratios.
            </p>
            <p>
              Remember that ideal weight is just a guideline. Factors like muscle mass, bone density, and overall health are also important.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}