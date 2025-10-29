/**
 * Utility functions for calculating school days and related date operations
 */

export interface Holiday {
  name: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Calculate the number of school days (weekdays excluding holidays) within a date range
 *
 * This function iterates through each day from termStart to termEnd (inclusive) and counts:
 * - Only weekdays (Monday through Friday)
 * - Excludes days that fall within any holiday range
 *
 * @param termStart - The start date of the term
 * @param termEnd - The end date of the term
 * @param holidays - Array of holiday objects with startDate and endDate
 * @returns The total number of school days
 *
 * @example
 * ```typescript
 * const schoolDays = calculateSchoolDays(
 *   new Date('2024-01-01'),
 *   new Date('2024-01-31'),
 *   [{ name: 'New Year', startDate: new Date('2024-01-01'), endDate: new Date('2024-01-01') }]
 * );
 * // Returns 22 (31 days - 9 weekends - 1 holiday, assuming Jan 1 is Monday)
 * ```
 */
export const calculateSchoolDays = (
  termStart: Date,
  termEnd: Date,
  holidays: Holiday[]
): number => {
  // Input validation
  if (!termStart || !termEnd) {
    throw new Error("termStart and termEnd are required");
  }

  if (termEnd < termStart) {
    throw new Error("termEnd must be after or equal to termStart");
  }

  let schoolDays = 0;

  // Iterate through each day from start to end (inclusive)
  for (
    let currentDate = new Date(termStart);
    currentDate <= termEnd;
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Only count weekdays (Monday = 1 through Friday = 5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Check if this date falls within any holiday range
      const isHoliday = holidays.some((holiday) => {
        const holidayStart = new Date(holiday.startDate);
        const holidayEnd = new Date(holiday.endDate);
        return currentDate >= holidayStart && currentDate <= holidayEnd;
      });

      // Only count if it's not a holiday
      if (!isHoliday) {
        schoolDays++;
      }
    }
  }

  return schoolDays;
};

/**
 * Calculate the total number of calendar days between two dates (inclusive)
 *
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns The total number of days between the dates (inclusive)
 */
export const calculateTotalDays = (startDate: Date, endDate: Date): number => {
  if (!startDate || !endDate) {
    throw new Error("startDate and endDate are required");
  }

  if (endDate < startDate) {
    throw new Error("endDate must be after or equal to startDate");
  }

  return (
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );
};
