
import { useSystemSettings } from "./useSystemSettings";
import { calculateSlots, CollegeTimings, Break } from "@/utils/timetable";
import { useMemo } from "react";

export const useTimetableSlots = () => {
    const { data: timingsData, loading: timingsLoading } = useSystemSettings('college_timings');
    const { data: breaksData, loading: breaksLoading } = useSystemSettings('breaks');

    const slots = useMemo(() => {
        if (!timingsData) return [];

        const timings: CollegeTimings = timingsData;
        const breaks: Break[] = Array.isArray(breaksData) ? breaksData : [];

        return calculateSlots(timings, breaks);
    }, [timingsData, breaksData]);

    return {
        slots,
        loading: timingsLoading || breaksLoading,
        timings: timingsData as CollegeTimings | null,
        breaks: (Array.isArray(breaksData) ? breaksData : []) as Break[]
    };
};
