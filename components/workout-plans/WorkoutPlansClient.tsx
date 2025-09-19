"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { WorkoutPlanCard } from "@/components/workout-plans/WorkoutPlanCard";
import { getClientWorkoutPlans } from "@/actions/client-workout/get-all-workout-plans-for-client";
import { ClientWorkoutPlan } from "@/actions/client-workout/get-all-workout-plans-for-client";
import { Search, Calendar, X } from "lucide-react";
import { toast } from "sonner";

interface WorkoutPlansClientProps {
  initialPlans: ClientWorkoutPlan[];
}

export function WorkoutPlansClient({ initialPlans }: WorkoutPlansClientProps) {
  const [plans, setPlans] = useState<ClientWorkoutPlan[]>(initialPlans);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState("all");

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPlans();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, dateRange, activeTab]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const result = await getClientWorkoutPlans({
        search: search.trim() || undefined,
        status: activeTab as "active" | "upcoming" | "previous" | "all",
        dateRange: dateRange?.from && dateRange?.to ? {
          from: dateRange.from,
          to: dateRange.to
        } : undefined,
        sortBy: "start_date",
        sortOrder: "desc"
      });

      if (result.error) {
        toast.error(result.error);
        setPlans([]);
      } else {
        setPlans(result.data?.plans || []);
      }
    } catch (error) {
      toast.error("Failed to load your workout plans, Please try later");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDateRange(undefined);
    setActiveTab("all");
  };

  const hasActiveFilters = search || dateRange || activeTab !== "all";

  const getEmptyMessage = (tab: string) => {
    switch (tab) {
      case "active":
        return "No active workout plans found.";
      case "upcoming":
        return "No upcoming workout plans found.";
      case "previous":
        return "No previous workout plans found.";
      default:
        return "No new workout plans added for you so far";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search workout plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            placeholder="Filter by date"
            className="w-64"
          />
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="hover:bg-muted/80"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Plans</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="previous">Previous</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-full">
                  <div className="bg-card p-6 rounded-lg border animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-16 bg-muted rounded-full"></div>
                        <div className="h-6 w-48 bg-muted rounded"></div>
                      </div>
                    </div>
                    <div className="h-4 w-full bg-muted rounded mb-2"></div>
                    <div className="h-4 w-3/4 bg-muted rounded mb-4"></div>
                    <div className="flex justify-end gap-2">
                      <div className="h-8 w-20 bg-muted rounded"></div>
                      <div className="h-8 w-24 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-lg font-medium text-muted-foreground mb-2">
                {getEmptyMessage(activeTab)}
              </div>
              <div className="text-sm text-muted-foreground">
                {hasActiveFilters 
                  ? "Try adjusting your filters to see more results."
                  : "Your trainer will assign workout plans for you."
                }
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <WorkoutPlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}