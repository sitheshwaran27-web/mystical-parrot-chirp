
/**
 * Helper to add minutes to a time string (HH:mm)
 */
export const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/**
 * Interface for college timings setting
 */
export interface CollegeTimings {
    start_time: string;
    end_time: string;
    num_periods: number;
    period_duration: number;
    break_gap: number;
    lab_duration: number;
}

/**
 * Interface for break setting
 */
export interface Break {
    id: string;
    name: string;
    start: string;
    end: string;
    type: 'lunch' | 'short';
}

/**
 * Generates an array of time slot strings (e.g., ["09:00-10:00", ...])
 * while accounting for breaks.
 */
export const calculateSlots = (timings: CollegeTimings, breaks: Break[]): string[] => {
    const slots: string[] = [];
    let currentTime = timings.start_time;

    // Sort breaks by start time
    const sortedBreaks = [...breaks].sort((a, b) => a.start.localeCompare(b.start));

    for (let i = 0; i < timings.num_periods; i++) {
        // Check if there's a break starting at or before current time
        const activeBreak = sortedBreaks.find(b => b.start === currentTime);

        if (activeBreak) {
            // If the slot is a break, we move current time to break end
            currentTime = activeBreak.end;
        }

        const endTime = addMinutes(currentTime, timings.period_duration);
        slots.push(`${currentTime}-${endTime}`);

        // Add gap between periods if not the last period
        if (i < timings.num_periods - 1) {
            currentTime = addMinutes(endTime, timings.break_gap || 0);
        }
    }

    return slots;
};
