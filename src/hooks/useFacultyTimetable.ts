import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/use-session';

interface ScheduleSlot {
    id: string;
    day: string;
    time_slot: string;
    class_name: string;
    subject_id: string;
    faculty_id: string;
    type: string;
    subjects: { name: string } | { name: string }[] | null;
    batches: { name: string } | { name: string }[] | null;
}

export const useFacultyTimetable = () => {
    const { user, profile } = useSession();
    const [timetable, setTimetable] = useState<ScheduleSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFacultyTimetable = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch faculty record to get faculty_id
                const { data: facultyData, error: facultyError } = await supabase
                    .from('faculty')
                    .select('id')
                    .eq('id', user.id)
                    .single();

                if (facultyError) {
                    console.error('Error fetching faculty record:', facultyError);
                    setError('Could not find faculty record');
                    setTimetable([]);
                    setLoading(false);
                    return;
                }

                if (!facultyData) {
                    setError('No faculty record found');
                    setTimetable([]);
                    setLoading(false);
                    return;
                }

                // Fetch schedule slots for this faculty member
                const { data, error: scheduleError } = await supabase
                    .from('schedule_slots')
                    .select(`
            id,
            day,
            time_slot,
            class_name,
            subject_id,
            faculty_id,
            type,
            subjects (name)
          `)
                    .eq('faculty_id', facultyData.id)
                    .order('day', { ascending: true })
                    .order('time_slot', { ascending: true });

                if (scheduleError) {
                    console.error('Error fetching timetable:', scheduleError);
                    setError('Failed to load timetable');
                    setTimetable([]);
                } else {
                    let finalSchedule = data as unknown as ScheduleSlot[];
                    const todayDate = new Date().toISOString().split('T')[0];

                    // 1. Fetch "My Assignments" (where I am the substitute today/future)
                    const { data: assignments } = await supabase
                        .from('substitutions')
                        .select(`
                            id, date, schedule_slot_id, 
                            schedule_slot (
                                id, day, time_slot, class_name, subject_id, faculty_id, type,
                                subjects (name)
                            )
                        `)
                        .eq('substitute_faculty_id', facultyData.id)
                        .eq('status', 'Approved')
                        .gte('date', todayDate); // Only upcoming assignments

                    if (assignments) {
                        const assignmentSlots = assignments.map((sub: any) => {
                            const slot = sub.schedule_slot;
                            // Filter to match day of week if needed, though 'date' is specific
                            // We should only add them if the date matches the current view context
                            // But here we return ALL slots.
                            // The UI usually filters by DAY (Monday).
                            // If I add a specific date assignment to a "Monday" view, it might be confusing if not careful.
                            // However, usually timetable view is generic "Weekly".
                            // Special assignments override specific days.
                            // For simplicity: We add them with a special flag.
                            return {
                                ...slot,
                                id: `sub-${sub.id}`, // unique ID
                                type: 'substitution',
                                subjects: { name: `${slot.subjects?.name} (Sub Duty: ${sub.date})` }
                            };
                        });
                        // Add to list
                        finalSchedule = [...finalSchedule, ...assignmentSlots];
                    }

                    // 2. Fetch "My Absences" (where I am replaced)
                    // We need to know which of my slots are covered by someone else ON SPECIFIC DATES.
                    // This creates a complexity: The base schedule is generic "Monday", but absence is "2023-10-27".
                    // If we blindly modify the generic slot, it looks like I'm absent every Monday.
                    // Solution: We don't modify the generic template here.
                    // The UI (Widget) usually handles "Today's View" by filtering.
                    // We will return substitutions as a separate object or flag.

                    // Actually, let's keep it simple. We won't modify the base template for "My Absences"
                    // because that requires date-specific logic which belongs in the "Daily View" widget, not the "Weekly Timetable" hook.
                    // But for "Assignments", they are extra duties, so adding them makes sense if we can distinguish.
                    // For now, only adding Assignments.

                    setTimetable(finalSchedule);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
                setError('An unexpected error occurred');
                setTimetable([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFacultyTimetable();
    }, [user?.id]);

    return { timetable, loading, error };
};
