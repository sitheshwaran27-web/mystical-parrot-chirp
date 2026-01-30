import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/context/SessionContext';
import { showError } from '@/utils/toast';

export const useStudentTimetable = () => {
    const { profile } = useSession();
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTimetable = useCallback(async () => {
        if (!profile?.class_name) {
            setLoading(false);
            return;
        }

        setLoading(true);
        console.log(`useStudentTimetable: Fetching slots for class_name: "${profile.class_name}"`);

        const { data, error } = await supabase
            .from("schedule_slots")
            .select(`
                id,
                day,
                time_slot,
                subjects (name),
                faculty (name),
                type,
                room_id,
                class_name
            `)
            .eq("class_name", profile.class_name);

        if (error) {
            console.error("Error fetching student timetable:", error);
            showError("Failed to load timetable data.");
        } else {
            setTimetable(data || []);
        }
        setLoading(false);
    }, [profile?.class_name]);

    const [substitutions, setSubstitutions] = useState<any[]>([]);

    useEffect(() => {
        const fetchSubs = async () => {
            if (!profile?.class_name) return;
            const todayDate = new Date().toISOString().split('T')[0];

            // Fetch substitutions for today where the slot belongs to this class
            // This requires joining schedule_slots.
            // Simplified: Fetch all approved substitutions for today, then match slot IDs client-side if needed
            // Or use deep filtering if possible.
            // Let's fetch all subs for today and filter client side for safety against complex RLS rules

            const { data } = await supabase
                .from('substitutions')
                .select(`
                    schedule_slot_id,
                    substitute_faculty (name)
                `)
                .eq('date', todayDate)
                .eq('status', 'Approved');

            setSubstitutions(data || []);
        };
        fetchSubs();
    }, [profile?.class_name]);

    useEffect(() => {
        fetchTimetable();
    }, [fetchTimetable]);

    const getTodayClasses = () => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const baseClasses = timetable.filter(s => s.day === today && s.type === 'lecture');

        return baseClasses.map(cls => {
            const sub = substitutions.find(s => s.schedule_slot_id === cls.id);
            if (sub) {
                return {
                    ...cls,
                    faculty: { name: `${sub.substitute_faculty?.name} (Sub)` },
                    is_substitution: true
                };
            }
            return cls;
        });
    };



    const getNextClass = () => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const now = new Date();
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

        const todayClasses = timetable.filter(s => s.day === today && s.type === 'lecture');

        // Helper to convert "HH:MM" or "HH:MM AM/PM" to minutes from midnight
        const getMinutes = (timeStr: string) => {
            if (!timeStr) return 0;
            const cleanTime = timeStr.replace(/[AM|PM]/g, '').trim();
            let [h, m] = cleanTime.split(':').map(Number);
            if (timeStr.includes('PM') && h !== 12) h += 12;
            if (timeStr.includes('AM') && h === 12) h = 0;
            return h * 60 + m;
        };

        const sortedClasses = [...todayClasses].sort((a, b) => {
            const timeA = getMinutes(a.time_slot.split('-')[0]);
            const timeB = getMinutes(b.time_slot.split('-')[0]);
            return timeA - timeB;
        });

        // Find the first class that starts after now, or just the first one of the day if none left
        return sortedClasses.find(s => getMinutes(s.time_slot.split('-')[0]) > currentTimeInMinutes) || sortedClasses[0];
    };

    return {
        timetable,
        loading,
        getTodayClasses,
        getNextClass,
        refresh: fetchTimetable
    };
};
