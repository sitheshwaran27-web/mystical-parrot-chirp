export type ExamType = 'Internal' | 'Model' | 'Semester';
export type ExamSession = 'Morning' | 'Afternoon';

export interface Exam {
    id: string;
    name: string;
    type: ExamType;
    start_date: string; // ISO Date string
    end_date: string;   // ISO Date string
    morning_session_start: string; // HH:mm:ss
    morning_session_end: string;   // HH:mm:ss
    afternoon_session_start: string; // HH:mm:ss
    afternoon_session_end: string;   // HH:mm:ss
    is_active: boolean;
    created_at?: string;
}

export interface ExamHall {
    id: string;
    name: string;
    capacity: number;
    department_id?: string | null;
    created_at?: string;
}

export interface ExamSchedule {
    id: string;
    exam_id: string;
    subject_id: string;
    exam_date: string;
    session: ExamSession;
    hall_id?: string | null;
    batch_id: string;
    created_at?: string;

    // Joins
    subject?: { name: string; code?: string };
    exam_hall?: { name: string };
    batch?: { name: string };
}

export interface InvigilationDuty {
    id: string;
    exam_schedule_id: string;
    faculty_id: string;
    is_chief_invigilator: boolean;

    // Joins
    exam_schedule?: ExamSchedule;
    faculty?: { name: string };
}
