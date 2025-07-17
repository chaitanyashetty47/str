import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MetricCard from "@/components/calculator/cards/metric-card";
export default function CalculatorPage() {

  return (
    <div>
      <div className="flex flex-col gap-4 justify-center items-center">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard />
        </div>

      </div>
    </div>
  );
}

