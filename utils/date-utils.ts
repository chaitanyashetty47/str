/**
 * Date utility functions for workout scheduling
 */
import { addDays, format } from "date-fns";

/**
 * Strip timezone information from a Date object to create a pure date
 * This ensures dates are stored as DD-MM-YYYY without timezone complications
 * @param date - The Date object to strip timezone from
 * @returns A new Date object with only date components (no time/timezone)
 */
export function stripTimezone(date: Date): Date {
  // Create a new date using UTC to avoid timezone offset issues
  // This ensures the date is exactly what the user selected, regardless of timezone
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

/**
 * Get the Monday-Sunday date range for a given date
 */
function getWeekDateRange(date: Date): { startDate: Date; endDate: Date } {
  const startDate = new Date(date);
  const daysToMonday = (startDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  startDate.setDate(startDate.getDate() - daysToMonday);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Get week date range as ISO strings for a given date
 */
export function getWeekRange(date: Date): { startDate: string; endDate: string } {
  const { startDate, endDate } = getWeekDateRange(date);
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

/**
 * Get week date range as simple YYYY-MM-DD strings for URLs
 */
export function getWeekRangeSimple(date: Date): { startDate: string; endDate: string } {
  const { startDate, endDate } = getWeekDateRange(date);
  return {
    startDate: startDate.toISOString().split('T')[0], // Just the date part
    endDate: endDate.toISOString().split('T')[0],     // Just the date part
  };
}

/**
 * Get the raw Date objects for a week range (useful for database queries)
 */
export function getWeekDateRangeRaw(date: Date): { startDate: Date; endDate: Date } {
  return getWeekDateRange(date);
}

/**
 * Check if a workout day is past the 7-day logging deadline
 * @param dayDateString - The workout day's scheduled date as ISO string
 * @returns true if the day is past the deadline (more than 7 days ago)
 */
export function isWorkoutDayPastDeadline(dayDateString: string): boolean {
  const scheduledDate = new Date(dayDateString);
  const currentDate = new Date();
  
  // Set both dates to midnight UTC for fair comparison
  const scheduledDateUTC = new Date(Date.UTC(
    scheduledDate.getUTCFullYear(),
    scheduledDate.getUTCMonth(),
    scheduledDate.getUTCDate()
  ));
  
  const currentDateUTC = new Date(Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate()
  ));
  
  // Calculate the difference in days
  const timeDifference = currentDateUTC.getTime() - scheduledDateUTC.getTime();
  const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
  
  // Return true if more than 7 days have passed
  return daysDifference > 7;
}

/**
 * Get the deadline date for a workout day (7 days after the scheduled date)
 * @param dayDateString - The workout day's scheduled date as ISO string
 * @returns The deadline date as a formatted string
 */
export function getWorkoutDeadlineDate(dayDateString: string): string {
  const scheduledDate = new Date(dayDateString);
  const deadlineDate = new Date(scheduledDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return deadlineDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format week range for display (e.g., "Aug 23 - Aug 29")
 * @param startDate - The start date of the week
 * @returns Formatted week range string
 */
export function formatWeekRange(startDate: Date): string {
  const endDate = addDays(startDate, 6);
  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;
}