import PageHeaderTemplate from "@/components/page-header-template";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Scale, Target, Zap, TrendingUp, Heart, Dumbbell, CalculatorIcon } from "lucide-react";
import Link from "next/link";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fitness Calculators - Strentor",
  description: "Comprehensive collection of fitness and health calculators. Calculate BMI, BMR, body fat, calorie needs, ideal weight, and more to optimize your training.",
  keywords: ["fitness calculators", "BMI calculator", "BMR calculator", "body fat calculator", "calorie calculator", "health tools"],
};

export default async function Calculator() {
  // Validate user authentication and CLIENT role
  const { user } = await validateServerRole(['CLIENT']);
  
  const calculators = [
    {
      title: "BMI Calculator",
      description: "Calculate your Body Mass Index based on weight and height",
      icon: Scale,
      href: "/calculator/bmi",
      color: "text-blue-600"
    },
    {
      title: "BMR Calculator",
      description: "Calculate your Basal Metabolic Rate for daily calorie needs",
      icon: Activity,
      href: "/calculator/bmr",
      color: "text-green-600"
    },
    {
      title: "Body Fat Calculator",
      description: "Estimate body fat percentage using various measurements",
      icon: Target,
      href: "/calculator/body-fat",
      color: "text-purple-600"
    },
    {
      title: "Calorie Needs",
      description: "Calculate daily calorie requirements based on activity level",
      icon: Zap,
      href: "/calculator/calorie-needs",
      color: "text-orange-600"
    },
    {
      title: "Ideal Weight",
      description: "Determine your ideal weight range based on height and build",
      icon: TrendingUp,
      href: "/calculator/ideal-weight",
      color: "text-red-600"
    },
    {
      title: "Lean Body Mass",
      description: "Calculate your lean body mass and muscle percentage",
      icon: Heart,
      href: "/calculator/lean-body-mass",
      color: "text-pink-600"
    },
    {
      title: "One Rep Max",
      description: "Calculate your one repetition maximum for strength training",
      icon: Dumbbell,
      href: "/calculator/one-rep-max",
      color: "text-indigo-600"
    },
    {
      title: "Macro Split",
      description: "Calculate optimal macronutrient distribution for your goals",
      icon: CalculatorIcon,
      href: "/calculator/macro-split",
      color: "text-teal-600"
    }
  ];

  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 md:px-8 py-8 bg-background">
      <PageHeaderTemplate 
        title="Fitness Calculators" 
        description="Choose from our comprehensive collection of fitness and health calculators to track your progress and optimize your training" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calculators.map((calculator) => {
          const IconComponent = calculator.icon;
          return (
            <Link key={calculator.href} href={calculator.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-6 h-6 ${calculator.color}`} />
                    <CardTitle className="text-lg">{calculator.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground">
                    {calculator.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}