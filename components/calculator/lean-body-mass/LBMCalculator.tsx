"use client";

import { useState } from "react";
import { Gender } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Scale, User, Calculator, Activity } from "lucide-react";

interface LBMCalculatorProps {
  height: number;
  gender: Gender;
  weight: number;
}

export function LBMCalculator({ 
  height, 
  gender, 
  weight 
}: LBMCalculatorProps) {
  const [showInfo, setShowInfo] = useState(false);

  // Calculate lean body mass using Boer formula
  function calculateLBM(height: number, weight: number, gender: Gender): number {
    if (gender === Gender.MALE) {
      return 0.407 * weight + 0.267 * height - 19.2;
    } else {
      return 0.252 * weight + 0.473 * height - 48.3;
    }
  }

  const leanBodyMass = calculateLBM(height, weight, gender);
  const bodyFatWeight = weight - leanBodyMass;
  const bodyFatPercentage = (bodyFatWeight / weight) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Main Calculator */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Your Lean Body Mass
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

            {/* Weight Display */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Weight</span>
              </div>
              <span className="font-semibold">{weight} kg</span>
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

            {/* Lean Body Mass Result */}
            <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {leanBodyMass.toFixed(1)} kg
              </div>
              <div className="text-sm text-green-700">
                Lean Body Mass (Boer Formula)
              </div>
            </div>

            {/* Body Composition Breakdown */}
            <div className="space-y-4">
              <div className="text-center font-semibold text-gray-700">
                Body Composition Breakdown
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {leanBodyMass.toFixed(1)} kg
                  </div>
                  <div className="text-xs text-green-700">Lean Mass</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">
                    {bodyFatWeight.toFixed(1)} kg
                  </div>
                  <div className="text-xs text-orange-700">Fat Mass</div>
                </div>
              </div>

              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700">
                  Body Fat Percentage: <span className="font-semibold">{bodyFatPercentage.toFixed(1)}%</span>
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
              <Calculator className="w-5 h-5 text-blue-600" />
              Boer Formula
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              The Boer formula (1984) is the most widely used method for calculating lean body mass in medical settings.
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-800 mb-1">For Men:</div>
                <div className="text-sm text-blue-700">
                  LBM = 0.407 × Weight + 0.267 × Height - 19.2
                </div>
              </div>

              <div className="p-3 bg-pink-50 rounded-lg">
                <div className="font-semibold text-pink-800 mb-1">For Women:</div>
                <div className="text-sm text-pink-700">
                  LBM = 0.252 × Weight + 0.473 × Height - 48.3
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              * Weight in kg, Height in cm
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Lean Body Mass</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              Lean Body Mass (LBM) includes all body components except fat: muscles, bones, organs, and water.
            </p>
            <p>
              The Boer formula is commonly used in medical settings for drug dosage calculations and body composition analysis.
            </p>
            <p>
              LBM typically ranges from 60-90% of total body weight, with men generally having higher percentages than women.
            </p>
            <p>
              This calculation helps track muscle mass changes during fitness programs and weight management.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Body Composition Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span><strong>Lean Mass:</strong> Muscles, bones, organs, water</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span><strong>Fat Mass:</strong> Essential and storage fat</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Higher lean body mass generally indicates better muscle development and metabolic health.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}