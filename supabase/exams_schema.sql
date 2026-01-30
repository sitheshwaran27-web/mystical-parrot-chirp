-- Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Internal', 'Model', 'Semester')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    morning_session_start TIME NOT NULL DEFAULT '09:30:00',
    morning_session_end TIME NOT NULL DEFAULT '12:30:00',
    afternoon_session_start TIME NOT NULL DEFAULT '14:00:00',
    afternoon_session_end TIME NOT NULL DEFAULT '17:00:00',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Halls Table
CREATE TABLE IF NOT EXISTS exam_halls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 30,
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Schedules Table
CREATE TABLE IF NOT EXISTS exam_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    batch_id UUID REFERENCES batches(id),
    exam_date DATE NOT NULL,
    session TEXT NOT NULL CHECK (session IN ('Morning', 'Afternoon')),
    hall_id UUID REFERENCES exam_halls(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invigilation Duties Table
CREATE TABLE IF NOT EXISTS invigilation_duties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_schedule_id UUID REFERENCES exam_schedules(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id),
    is_chief_invigilator BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE invigilation_duties ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin Full Access, Authenticated Read)
-- Exams
DROP POLICY IF EXISTS "Admins full access exams" ON exams;
CREATE POLICY "Admins full access exams" ON exams
    FOR ALL TO authenticated
    USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
    WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Authenticated read exams" ON exams;
CREATE POLICY "Authenticated read exams" ON exams
    FOR SELECT TO authenticated
    USING (true);

-- Exam Halls
DROP POLICY IF EXISTS "Admins full access exam_halls" ON exam_halls;
CREATE POLICY "Admins full access exam_halls" ON exam_halls
    FOR ALL TO authenticated
    USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
    WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Authenticated read exam_halls" ON exam_halls;
CREATE POLICY "Authenticated read exam_halls" ON exam_halls
    FOR SELECT TO authenticated
    USING (true);

-- Exam Schedules
DROP POLICY IF EXISTS "Admins full access exam_schedules" ON exam_schedules;
CREATE POLICY "Admins full access exam_schedules" ON exam_schedules
    FOR ALL TO authenticated
    USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
    WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Authenticated read exam_schedules" ON exam_schedules;
CREATE POLICY "Authenticated read exam_schedules" ON exam_schedules
    FOR SELECT TO authenticated
    USING (true);

-- Invigilation Duties
DROP POLICY IF EXISTS "Admins full access invigilation_duties" ON invigilation_duties;
CREATE POLICY "Admins full access invigilation_duties" ON invigilation_duties
    FOR ALL TO authenticated
    USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
    WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Authenticated read invigilation_duties" ON invigilation_duties;
CREATE POLICY "Authenticated read invigilation_duties" ON invigilation_duties
    FOR SELECT TO authenticated
    USING (true);
