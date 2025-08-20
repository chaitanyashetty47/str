import PageHeaderTemplate from "@/components/page-header-template";
import BMICalculator from "@/components/calculator/bmi/BMICalculator";
import { getWeightHeight } from "@/actions/body-measurement-metrics/get-weight-height.action";

export default async function BMICalculatorPage() {
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
