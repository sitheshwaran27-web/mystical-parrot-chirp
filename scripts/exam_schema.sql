-- Create Exams Table
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Internal', 'Model', 'Semester')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  morning_session_start TIME NOT NULL,
  morning_session_end TIME NOT NULL,
  afternoon_session_start TIME NOT NULL,
  afternoon_session_end TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Exam Halls Table
CREATE TABLE exam_halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL, -- specific department hall or null for general
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Exam Schedules Table
CREATE TABLE exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  session TEXT NOT NULL CHECK (session IN ('Morning', 'Afternoon')),
  hall_id UUID REFERENCES exam_halls(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE, -- specific batch taking the exam
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, subject_id, batch_id) -- A batch only takes a subject exam once per cycle
);

-- Create Invigilation Duties Table
CREATE TABLE invigilation_duties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_schedule_id UUID REFERENCES exam_schedules(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  is_chief_invigilator BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_schedule_id, faculty_id)
);

-- Enable RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE invigilation_duties ENABLE ROW LEVEL SECURITY;

-- Policies for Exams (Admin full, others read active)
CREATE POLICY "Admin full access exams" ON exams FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com'); -- Replace with actual admin check
CREATE POLICY "Public read active exams" ON exams FOR SELECT USING (is_active = true);

-- Policies for Exam Halls (Admin full, others read)
CREATE POLICY "Admin full access halls" ON exam_halls FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');
CREATE POLICY "Public read halls" ON exam_halls FOR SELECT USING (true);

-- Policies for Exam Schedules (Admin full, others read)
CREATE POLICY "Admin full access schedules" ON exam_schedules FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');
CREATE POLICY "Public read schedules" ON exam_schedules FOR SELECT USING (true);

-- Policies for Invigilation (Admin full, Faculty read own)
CREATE POLICY "Admin full access invigilation" ON invigilation_duties FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');
CREATE POLICY "Faculty read own duties" ON invigilation_duties FOR SELECT USING (
  faculty_id IN (SELECT id FROM faculty WHERE user_id = auth.uid())
);
