
export type SubstitutionStatus = 'Pending' | 'Approved' | 'Rejected';

export interface FacultyAbsence {
    id: string;
    faculty_id: string;
    start_date: string;
    end_date: string;
    reason?: string;
    created_at?: string;

    // Joins
    faculty?: {
        name: string;
        department?: string;
    };
}

export interface Substitution {
    id: string;
    absence_id: string;
    schedule_slot_id: string;
    substitute_faculty_id?: string | null;
    date: string; // YYYY-MM-DD
    status: SubstitutionStatus;
    created_at?: string;

    // Joins
    schedule_slot?: {
        day: string;
        time_slot: string;
        subject?: { name: string };
        class_name?: string;
        room_id?: string;
    };
    substitute_faculty?: {
        name: string;
    };
    absence?: {
        faculty?: { name: string };
    };
}

export interface RecommendedSubstitute {
    faculty_id: string;
    faculty_name: string;
    department: string;
    workload_score: number; // e.g. number of classes this week
    is_free: boolean;
    conflict_reason?: string;
}
