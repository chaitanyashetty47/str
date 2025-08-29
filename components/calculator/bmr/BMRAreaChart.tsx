"use client"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface BMRData {
  date: string | Date;
  bmr: number;
  dailyCalories: number;
  weight: number;
  height: number;
  age: number;
  activityLevel: string;
}

interface BMRAreaChartProps {
  data: BMRData[];
}

export default function BMRAreaChart({ data }: BMRAreaChartProps) {
  // Sort data by date (oldest to newest)
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  // Format data for the chart
  const chartData = sortedData.map((item) => ({
    date: typeof item.date === 'string' ? item.date : item.date.toISOString().split('T')[0],
    bmr: Math.round(item.bmr),
    dailyCalories: Math.round(item.dailyCalories),
    weight: item.weight,
    height: item.height,
    age: item.age,
    activityLevel: item.activityLevel
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{new Date(label).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <div className="mt-2 space-y-1">
            <p className="text-blue-600">
              <span className="font-medium">BMR:</span> {data.bmr} calories/day
            </p>
            <p className="text-green-600">
              <span className="font-medium">Daily Calories:</span> {data.dailyCalories} calories
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Weight:</span> {data.weight} kg
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Height:</span> {data.height} cm
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Age:</span> {data.age} years
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Activity:</span> {data.activityLevel.replace('_', ' ')}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500 text-lg">No BMR data available</p>
        <p className="text-gray-400 text-sm mt-2">Add your first BMR calculation to see trends</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-white rounded-lg border p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBMR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorDailyCalories" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
          />
          
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `${value}`}
            domain={['dataMin - 100', 'dataMax + 100']}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Area
            type="monotone"
            dataKey="bmr"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorBMR)"
            name="BMR"
          />
          
          <Area
            type="monotone"
            dataKey="dailyCalories"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDailyCalories)"
            name="Daily Calories"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">BMR (Basal Metabolic Rate)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Daily Calories (with activity)</span>
        </div>
      </div>
    </div>
  );
}










