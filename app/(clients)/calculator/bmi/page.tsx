import PageHeaderTemplate from "@/components/page-header-template";
import BMICalculator from "@/components/calculator/bmi/BMICalculator";
import { getWeightHeight } from "@/actions/body-measurement-metrics/get-weight-height.action";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "BMI Calculator - Strentor",
  description: "Calculate your Body Mass Index (BMI) to assess your weight status and health risks. Get personalized BMI results and health recommendations.",
  keywords: ["BMI calculator", "body mass index", "weight assessment", "health calculator", "fitness tools"],
};

export default async function BMICalculatorPage() {
  // Validate user authentication and CLIENT role
  const { user } = await validateServerRole(['CLIENT']);

  

  const weightHeight = await getWeightHeight();
  if(weightHeight.error) {
    return <div>Error: {weightHeight.error}</div>
  }
  const { weight, height } = weightHeight;

  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 md:px-8 py-8 bg-background">
      <PageHeaderTemplate 
        title="BMI Calculator" 
        description="Calculate your Body Mass Index (BMI) to assess your weight status and health risks" 
      />
      <BMICalculator initialWeight={weight || 0} initialHeight={height || 0} />
    </div>
  );
}
