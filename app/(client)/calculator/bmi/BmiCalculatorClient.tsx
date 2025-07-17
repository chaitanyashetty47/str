"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useActionState } from "react"
import { calculateBmiAction } from "@/actions/calculator.action"
import { DatePicker } from "@/components/ui/date-picker"
import { BmiHistoryType } from "@/actions/calculator.action"
import { getBmiHistoryAction } from "@/actions/calculator.action"

type CalculatorConfig = Record<string, {
  title: string
  description: string
  color: string
  bgColor: string
  resultColors?: Record<string, string>
}>

// Calculator configuration
const calculatorConfig: CalculatorConfig = {
  bmi: {
    title: "BMI Calculator",
    description: "Body mass index (BMI) is a measure of body fat based on height and weight that applies to adults.",
    color: "text-red-500",
    bgColor: "from-red-50 to-white",
    resultColors: {
      underweight: "text-blue-500",
      normal: "text-green-500",
      overweight: "text-yellow-500",
      obese: "text-red-500",
    },
  },
  calorie: {
    title: "Calorie Calculator",
    description: "Accurately calculate daily calories required for weight loss or maintenance.",
    color: "text-yellow-500",
    bgColor: "from-yellow-50 to-white",
  },
  "body-fat": {
    title: "Body Fat Calculator",
    description: "Estimate your body fat percentage using various measurement methods.",
    color: "text-green-500",
    bgColor: "from-green-50 to-white",
  },
  bmr: {
    title: "BMR Calculator",
    description: "Calculate your Basal Metabolic Rate - the calories your body needs at rest.",
    color: "text-red-500",
    bgColor: "from-red-50 to-white",
  },
  "ideal-weight": {
    title: "Ideal Weight Calculator",
    description: "Find your ideal weight range based on height, age, and frame size.",
    color: "text-yellow-500",
    bgColor: "from-yellow-50 to-white",
  },
  "lean-body-mass": {
    title: "Lean Body Mass Calculator",
    description: "Calculate your lean body mass - the weight of everything except fat.",
    color: "text-green-500",
    bgColor: "from-green-50 to-white",
  },
  "healthy-weight": {
    title: "Healthy Weight Calculator",
    description: "Determine your healthy weight range based on BMI standards.",
    color: "text-red-500",
    bgColor: "from-red-50 to-white",
  },
  "calories-burned": {
    title: "Calories Burned Calculator",
    description: "Calculate calories burned during various activities and exercises.",
    color: "text-yellow-500",
    bgColor: "from-yellow-50 to-white",
  },
  "one-rep-max": {
    title: "One Rep Max Calculator",
    description: "Estimate your one-repetition maximum for strength training exercises.",
    color: "text-green-500",
    bgColor: "from-green-50 to-white",
  },
  macro: {
    title: "Macro Calculator",
    description: "Calculate your ideal macronutrient ratios based on your goals.",
    color: "text-red-500",
    bgColor: "from-red-50 to-white",
  },
  "body-type": {
    title: "Body Type Calculator",
    description: "Determine your body type (somatotype) based on measurements and characteristics.",
    color: "text-yellow-500",
    bgColor: "from-yellow-50 to-white",
  },
}

function History({ getBmiCategory, getCategoryColor }: { getBmiCategory: (bmi: number) => string, getCategoryColor: (category: string) => string }) {
  const [history, setHistory] = useState<BmiHistoryType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      setError(null)
      try {
        const res = await getBmiHistoryAction()
        if (!res || !res.bmiHistory) {
          setError("Failed to fetch history")
          return
        }
        if ('bmiHistory' in res) {
          setHistory(res.bmiHistory)
        } else if ('error' in res) {
          setError("Failed to fetch history")
        }
      } catch (e) {
        setError("Failed to fetch history")
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (loading) return <p className="text-gray-500">Loading history...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!history.length) return <p className="text-gray-500">No history available yet. Calculate your BMI to see results here.</p>

  return (
    <div className="space-y-4">
      {history.map((item, index) => {
        const bmi = item.value
        const category = getBmiCategory(bmi)
        const color = getCategoryColor(category)
        // item.user_body_measurements?.date_logged may be Date or string
        const date = item.user_body_measurements?.date_logged
        const dateString = date ? new Date(date).toLocaleDateString() : "-"
        return (
          <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
            <div className="flex items-center">
              <div className={`text-2xl font-bold ${color}`}>{bmi}</div>
              <div className="ml-4">
                <div className={`font-medium ${color}`}>{category}</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">{dateString}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function BmiCalculatorClient() {
  const router = useRouter()
  const calculatorType ='bmi'
  const config = calculatorConfig[calculatorType as keyof typeof calculatorConfig] || calculatorConfig.bmi

  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [date, setDate] = useState<Date>(new Date())
  const [history, setHistory] = useState<BmiHistoryType[]>([])
  const [formmatedDate, setFormmatedDate] = useState<string>("")
  const [activeTab, setActiveTab] = useState("calculator")
  const [historyFilter, setHistoryFilter] = useState<"all" | "month" | "year">("all")
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)) // YYYY-MM format
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

  // useActionState for server action
  const initialState: { bmi?: number; error?: Record<string, string[]> } = {}
  const [formState, formAction] = useActionState(calculateBmiAction, initialState)

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setDate(date);
  };

  // Calculate BMI category client-side
  const getBmiCategory = (bmi: number | undefined) => {
    if (bmi === undefined) return ""
    if (bmi < 18.5) return "Underweight"
    if (bmi < 25) return "Normal"
    if (bmi < 30) return "Overweight"
    return "Obese"
  }

  useEffect(() => {
    if (date) {
      setFormmatedDate(date.toLocaleDateString())
    }
  }, [date])

  // Get color for BMI category
  const getCategoryColor = (category: string) => {
    if (!category) return ""
    const lowerCategory = category.toLowerCase()
    if (!config.resultColors) return ""
    if (lowerCategory === "underweight") return config.resultColors.underweight
    if (lowerCategory === "normal") return config.resultColors.normal
    if (lowerCategory === "overweight") return config.resultColors.overweight
    if (lowerCategory === "obese") return config.resultColors.obese
    return ""
  }

  // Calculate ideal weight
  const calculateIdealWeight = () => {
    const heightInMeters = height / 100
    return (22 * heightInMeters * heightInMeters).toFixed(1)
  }


  return (
    <main className={`container mx-auto px-4 py-8 bg-gradient-to-b ${config.bgColor}`}>
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Calculators </Button>
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-3xl font-bold mb-2 ${config.color}`}>{config.title}</h1>
        <p className="text-gray-600 mb-8">{config.description}</p>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger className="bg-white text-black  rounded-full px-6 py-2 hover:bg-gray-200" value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid md:grid-cols-2 sm:grid-cols-1 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <form action={formAction} className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <span className="font-medium">{weight}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Input
                          id="weight"
                          name="weight"
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(Number(e.target.value))}
                          className="w-20"
                          min={30}
                          max={200}
                          required
                        />
                        <Slider
                          value={[weight]}
                          min={30}
                          max={200}
                          step={0.1}
                          onValueChange={(value) => setWeight(value[0])}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="height">Height (cm)</Label>
                        <span className="font-medium">{height}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Input
                          id="height"
                          name="height"
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(Number(e.target.value))}
                          className="w-20"
                          min={100}
                          max={250}
                          required
                        />
                        <Slider
                          value={[height]}
                          min={100}
                          max={250}
                          step={1}
                          onValueChange={(value) => setHeight(value[0])}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mt-6">
                      <div className="flex justify-between">
                        <Label htmlFor="date_logged">Measurement Date</Label>
                        <span className="font-medium">{formmatedDate}</span>
                      </div>
                      <input type="hidden" name="date_logged" value={date ? date.toISOString().split("T")[0] : ""} />
                      <DatePicker date={date} onSelect={handleDateSelect} />
                    </div>
                    <Button className="w-full bg-green-500 hover:bg-green-600" type="submit">
                      Calculate {config.title.split(" ")[0]}
                    </Button>
                    {formState.error && (
                      <div className="text-red-500 text-sm">
                        {Object.entries(formState.error).map(([field, errors]) => (
                          <div key={field}>{field}: {Array.isArray(errors) ? errors.join(", ") : errors}</div>
                        ))}
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
              {formState.bmi !== undefined && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-500">Your BMI</h3>
                        <div className={`text-7xl font-bold ${getCategoryColor(getBmiCategory(formState.bmi))}`}>{formState.bmi}</div>
                        <div className="mt-2 text-lg">
                          You are <span className={`font-medium ${getCategoryColor(getBmiCategory(formState.bmi))}`}>{getBmiCategory(formState.bmi)}</span>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div className="bg-blue-500 h-full w-1/4"></div>
                          <div className="bg-green-500 h-full w-1/4"></div>
                          <div className="bg-yellow-500 h-full w-1/4"></div>
                          <div className="bg-red-500 h-full w-1/4"></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>
                          Underweight
                          <br />
                          &lt;18.5
                        </span>
                        <span>
                          Normal
                          <br />
                          18.5-24.9
                        </span>
                        <span>
                          Overweight
                          <br />
                          25-29.9
                        </span>
                        <span>
                          Obese
                          <br />
                          &gt;30
                        </span>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-gray-600">
                          Your ideal weight is <span className="font-medium">{calculateIdealWeight()} kg</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <h3 className="text-xl font-bold">History</h3>
                  <div className="flex flex-col sm:flex-row gap-3 mt-3 md:mt-0">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="historyFilter" className="whitespace-nowrap">
                        View by:
                      </Label>
                      <select
                        id="historyFilter"
                        value={historyFilter}
                        onChange={(e) => setHistoryFilter(e.target.value as "all" | "month" | "year")}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="all">All Records</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                      </select>
                    </div>
                    {historyFilter === "month" && (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="monthFilter" className="whitespace-nowrap">
                          Select month:
                        </Label>
                        <Input
                          id="monthFilter"
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="w-36 text-sm"
                        />
                      </div>
                    )}
                    {historyFilter === "year" && (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="yearFilter" className="whitespace-nowrap">
                          Select year:
                        </Label>
                        <select
                          id="yearFilter"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <History getBmiCategory={getBmiCategory} getCategoryColor={getCategoryColor} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
} 