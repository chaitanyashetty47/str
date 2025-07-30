"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bug, AlertTriangle, CheckCircle } from "lucide-react";
import { debugPRDetection, PRDebugData } from "@/actions/client-workout/debug-pr-detection.action";

interface PRDebugPanelProps {
  planId: string;
}

export default function PRDebugPanel({ planId }: PRDebugPanelProps) {
  const [debugData, setDebugData] = useState<PRDebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const runDebug = async () => {
    setLoading(true);
    const result = await debugPRDetection({ planId, weekNumber: selectedWeek });
    
    if (result.data) {
      setDebugData(result.data);
    } else {
      console.error("Debug failed:", result.error);
    }
    setLoading(false);
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <Bug className="h-5 w-5" />
          PR Detection Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Week:</label>
            <select 
              value={selectedWeek} 
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {[1, 2, 3, 4].map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
          </div>
          <Button 
            onClick={runDebug} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? "Running..." : "Debug PRs"}
          </Button>
        </div>

        {debugData && (
          <div className="space-y-4 text-sm">
            {/* Plan Info */}
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-semibold mb-2">Plan Information</h4>
              <p>Plan Start: {new Date(debugData.planInfo.startDate).toLocaleDateString()}</p>
              <p>Week Start: {new Date(debugData.planInfo.weekStartDate).toLocaleDateString()}</p>
            </div>

            {/* Existing PRs */}
            <div className="bg-green-50 p-3 rounded">
              <h4 className="font-semibold mb-2">Existing PRs Before Week {selectedWeek}</h4>
              {debugData.existingPRs.length === 0 ? (
                <p className="text-green-600">✅ No existing PRs found (expected for new users)</p>
              ) : (
                debugData.existingPRs.map((pr, i) => (
                  <div key={i} className="mb-1">
                    {pr.exerciseName}: {pr.maxWeight}kg ({new Date(pr.dateAchieved).toLocaleDateString()})
                  </div>
                ))
              )}
            </div>

            {/* Exercise Logs Analysis */}
            <div className="bg-yellow-50 p-3 rounded max-h-96 overflow-y-auto">
              <h4 className="font-semibold mb-2">Exercise Logs Analysis</h4>
              {debugData.exerciseLogs.map((log, i) => (
                <div key={i} className="mb-3 p-2 border rounded bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {log.exerciseName} - Set {log.setNumber}
                    </span>
                    {log.shouldBePR ? (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Should be PR
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Not a PR
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Weight: {log.weight}kg × {log.reps} reps = {log.calculatedORM}kg ORM</p>
                    <p>Exceeds Previous PR: {log.exceedsPreviousPR ? "✅" : "❌"}</p>
                    <p>Exceeds Week Best: {log.exceedsWeekBest ? "✅" : "❌"}</p>
                    <p>Logged: {new Date(log.loggedDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Week Best ORMs */}
            <div className="bg-purple-50 p-3 rounded">
              <h4 className="font-semibold mb-2">Week Best ORMs</h4>
              {Object.entries(debugData.weekBestORMs).map(([exerciseId, orm]) => {
                const exerciseName = debugData.exerciseLogs.find(log => log.exerciseId === exerciseId)?.exerciseName || exerciseId;
                return (
                  <div key={exerciseId}>
                    {exerciseName}: {orm}kg
                  </div>
                );
              })}
            </div>

            {/* Action Items */}
            <div className="bg-red-50 p-3 rounded">
              <h4 className="font-semibold mb-2 text-red-700">Debugging Checklist</h4>
              <ul className="text-red-600 space-y-1 text-xs">
                <li>• Check console logs for detailed step-by-step analysis</li>
                <li>• Verify dates are in correct timezone</li>
                <li>• Confirm exercise IDs match between logs and PRs</li>
                <li>• Check if PRs exist in client_max_lifts table</li>
                <li>• Validate ORM calculation: weight × (1 + reps/30)</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 