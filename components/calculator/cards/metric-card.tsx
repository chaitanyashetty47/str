import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Activity, Scale, Utensils, Flame, Dumbbell, PieChart, Heart, Calculator } from "lucide-react"
import Link from "next/link";

interface Calculator {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export default function MetricCard() {
  const calculators = [
    {
      id: "bmi",
      title: "BMI Calculator",
      description: "Calculate your Body Mass Index based on height and weight.",
      icon: <Scale className="h-8 w-8 text-red-500" />,
      color: "bg-red-50",
    },
    {
      id: "calorie",
      title: "Calorie Calculator",
      description: "Determine your daily calorie needs for weight management.",
      icon: <Utensils className="h-8 w-8 text-yellow-500" />,
      color: "bg-yellow-50",
    },
    {
      id: "body-fat",
      title: "Body Fat Calculator",
      description: "Estimate your body fat percentage using various methods.",
      icon: <Activity className="h-8 w-8 text-green-500" />,
      color: "bg-green-50",
    },
    {
      id: "bmr",
      title: "BMR Calculator",
      description: "Calculate your Basal Metabolic Rate for basic energy needs.",
      icon: <Flame className="h-8 w-8 text-red-500" />,
      color: "bg-red-50",
    },
    {
      id: "ideal-weight",
      title: "Ideal Weight Calculator",
      description: "Find your ideal weight range based on height and frame.",
      icon: <Scale className="h-8 w-8 text-yellow-500" />,
      color: "bg-yellow-50",
    },
    {
      id: "lean-body-mass",
      title: "Lean Body Mass Calculator",
      description: "Calculate your lean body mass excluding fat weight.",
      icon: <Activity className="h-8 w-8 text-green-500" />,
      color: "bg-green-50",
    },
    {
      id: "healthy-weight",
      title: "Healthy Weight Calculator",
      description: "Determine your healthy weight range based on BMI standards.",
      icon: <Heart className="h-8 w-8 text-red-500" />,
      color: "bg-red-50",
    },
    {
      id: "calories-burned",
      title: "Calories Burned Calculator",
      description: "Calculate calories burned during various activities.",
      icon: <Flame className="h-8 w-8 text-yellow-500" />,
      color: "bg-yellow-50",
    },
    {
      id: "one-rep-max",
      title: "One Rep Max Calculator",
      description: "Estimate your one-repetition maximum for strength training.",
      icon: <Dumbbell className="h-8 w-8 text-green-500" />,
      color: "bg-green-50",
    },
    {
      id: "macro",
      title: "Macro Calculator",
      description: "Calculate your ideal macronutrient ratios for your goals.",
      icon: <PieChart className="h-8 w-8 text-red-500" />,
      color: "bg-red-50",
    },
    {
      id: "body-type",
      title: "Body Type Calculator",
      description: "Determine your body type (somatotype) based on measurements.",
      icon: <Activity className="h-8 w-8 text-yellow-500" />,
      color: "bg-yellow-50",
    },
  ] as Calculator[];

  return (
    <>
      {calculators.map((calculator : Calculator) => (
        <Link 
        href={`/calculator/${calculator.id}`}
        key={calculator.id}
        className="transition-transform hover:scale-105 hover:shadow-lg hover:bg-gray-50">
          <Card className="h-full border-2 hover:border-gray-300">
          <CardHeader className={`${calculator.color} rounded-t-lg`}>
            <div className="flex items-center gap-3">
              {calculator.icon} 
              <CardTitle className="text-lg font-semibold">{calculator.title}</CardTitle>
            </div>
            </CardHeader>
            <CardContent className="pt-4">
                <CardDescription className="text-base">{calculator.description}</CardDescription>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Calculator className="h-5 w-5 text-gray-500" />
              </CardFooter>
          </Card>
        </Link>
      ))}
    </>
  )
}