"use client";

import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, User, Ruler, Weight, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BodyPart } from "@prisma/client";

interface ClientProfile {
  id: string;
  name: string;
  height?: number | null;
  weight?: number | null;
  neck?: number | null;
  waist?: number | null;
  hips?: number | null;
  gender?: string | null;
}

interface BestPR {
  id: string;
  exerciseName: string;
  exerciseType: BodyPart;
  maxWeight?: number | null;
  maxReps?: number | null;
  exerciseTypeEnum: "WEIGHT_BASED" | "REPS_BASED";
  dateAchieved: Date;
}

interface ClientProfileClientProps {
  profile: ClientProfile;
  bestPRs: BestPR[];
  uniqueBodyParts: BodyPart[];
}

export function ClientProfileClient({ profile, bestPRs, uniqueBodyParts }: ClientProfileClientProps) {
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | "">("");

  // Filter PRs based on selected body part
  const filteredPRs = selectedBodyPart 
    ? bestPRs.filter(pr => pr.exerciseType === selectedBodyPart)
    : bestPRs;

  // Format measurement values
  const formatMeasurement = (value?: number | null, unit: string = "cm") => {
    return value ? `${value} ${unit}` : "N/A";
  };

  return (
    <div className="space-y-6">
      {/* Client Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-strentor-red" />
            <span className="text-black">Client Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{profile.name}</h3>
                <p className="text-sm text-muted-foreground">Client Name</p>
              </div>
              <div className="flex items-center gap-2">
                {/* <User className="h-4 w-4 text-strentor-red" /> */}
                <span className="text-sm font-medium">Gender:</span>
                <span className="text-sm text-foreground ">{profile.gender}</span>
              </div>
              </div>

            {/* Physical Measurements */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-strentor-red" />
                <span className="text-sm font-medium">Height:</span>
                <span className="text-sm text-foreground">{formatMeasurement(profile.height)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-strentor-red" />
                <span className="text-sm font-medium">Weight:</span>
                <span className="text-sm text-foreground">{formatMeasurement(profile.weight, "kg")}</span>
              </div>
            </div>

            {/* Body Measurements */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-strentor-red" />
                <span className="text-sm font-medium">Neck:</span>
                <span className="text-sm text-foreground">{formatMeasurement(profile.neck)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-strentor-red" />
                <span className="text-sm font-medium">Waist:</span>
                <span className="text-sm text-foreground">{formatMeasurement(profile.waist)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-strentor-red" />
                <span className="text-sm font-medium">Hip:</span>
                <span className="text-sm text-foreground">{formatMeasurement(profile.hips)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Personal Records */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-strentor-red" />
              <span className="text-black">Best Personal Records</span>
            </CardTitle>
            
            {/* Body Part Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Filter by Body Part</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-48 justify-between">
                    <span className="text-foreground truncate">{selectedBodyPart || "All Body Parts"}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onClick={() => setSelectedBodyPart("")}
                  >
                    All Body Parts
                  </DropdownMenuItem>
                  {uniqueBodyParts.map((bodyPart) => (
                    <DropdownMenuItem 
                      key={bodyPart} 
                      onClick={() => setSelectedBodyPart(bodyPart)}
                    >
                      {bodyPart}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPRs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium text-foreground">
                No personal records found.
              </p>
              <p className="text-sm mt-2 text-muted-foreground">
                {selectedBodyPart ? `No PRs found for ${selectedBodyPart}` : "Client hasn't logged any workouts yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Exercise</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Body Part</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Best Weight</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Best Reps</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date Achieved</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPRs.map((record, index) => (
                    <tr 
                      key={record.id} 
                      className={`border-b border-border hover:bg-muted/50 transition-colors ${
                        index % 2 === 0 ? "bg-muted/30" : ""
                      }`}
                    >
                      <td className="py-3 px-2 font-medium text-foreground">{record.exerciseName}</td>
                      <td className="py-3 px-2 text-foreground capitalize">{record.exerciseType}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {record.exerciseTypeEnum === "WEIGHT_BASED" ? "ORM" : "Reps"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-foreground">
                        {record.maxWeight ? `${record.maxWeight} kg` : "-"}
                      </td>
                      <td className="py-3 px-2 text-foreground">
                        {record.maxReps ? `${record.maxReps}` : "-"}
                      </td>
                      <td className="py-3 px-2 text-foreground">
                        {new Date(record.dateAchieved).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
