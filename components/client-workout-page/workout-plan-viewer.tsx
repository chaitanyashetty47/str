'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FullWorkoutPlan } from '@/actions/client-workout/client-full-workout.action';
import { getWeekRangeSimple } from '@/utils/date-utils';
import { Button } from '@/components/ui/button';
import { Dumbbell } from 'lucide-react';
import WeekProgressIndicator from './week-progress-indicator';
import DayListTabs from './day-list-tabs';
import ExerciseList from './exercise-list';

interface WorkoutPlanViewerProps {
  plan: FullWorkoutPlan;
}

export default function WorkoutPlanViewer({ plan }: WorkoutPlanViewerProps) {
  const [selectedWeek, setSelectedWeek] = useState(plan.progress.currentWeek);
  const [selectedDay, setSelectedDay] = useState(plan.progress.currentDay);

  // Get current week data
  const currentWeek = plan.weeks.find(w => w.weekNumber === selectedWeek);
  
  // Get current day data (fallback to first day if selected day doesn't exist)
  const currentDay = currentWeek?.days.find(d => d.dayNumber === selectedDay) || currentWeek?.days[0];

  // When week changes, reset to first available day in that week
  const handleWeekChange = (weekNumber: number) => {
    setSelectedWeek(weekNumber);
    const newWeek = plan.weeks.find(w => w.weekNumber === weekNumber);
    if (newWeek && newWeek.days.length > 0) {
      setSelectedDay(newWeek.days[0].dayNumber);
    }
  };

  const handleDayChange = (dayNumber: 1 | 2 | 3 | 4 | 5) => {
    setSelectedDay(dayNumber);
  };

  // Generate current week date range for logging link
  const getCurrentWeekRange = () => {
    const now = new Date();
    return getWeekRangeSimple(now);
  };

  return (
    <div className="space-y-6">
      {/* Header with Log Workout Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{plan.title}</h1>
          <p className="text-sm text-gray-600">{plan.description}</p>
        </div>
        <Link href={`/workout/${plan.id}?weekNumber=${selectedWeek}`}>
          <Button className="bg-strentor-orange hover:bg-strentor-orange/90">
            <Dumbbell className="h-4 w-4 mr-2" />
            Log Workout For Week {selectedWeek}
          </Button>
        </Link>
      </div>
      <WeekProgressIndicator
        planId={plan.id}
        planStartDate={plan.startDate}
        weekDuration={plan.durationWeeks}
        currentWeek={plan.progress.currentWeek}
        selectedWeek={selectedWeek}
        onWeekSelect={handleWeekChange}
      />
      
      {currentWeek && (
        <DayListTabs
          days={currentWeek.days}
          selectedDay={selectedDay}
          onDaySelect={handleDayChange}
        />
      )}
      
      {currentDay && (
        <ExerciseList exercises={currentDay.exercises} />
      )}
      
      {/* Show message if no exercises for the selected day */}
      {currentWeek && !currentDay && (
        <div className="text-center text-muted-foreground py-8">
          No exercises scheduled for this day
        </div>
      )}
    </div>
  );
} 