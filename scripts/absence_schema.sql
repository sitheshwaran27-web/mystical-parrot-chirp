-- Create Faculty Absences Table
CREATE TABLE faculty_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Substitutions Table
CREATE TABLE substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  absence_id UUID REFERENCES faculty_absences(id) ON DELETE CASCADE,
  schedule_slot_id UUID REFERENCES schedule_slots(id) ON DELETE CASCADE,
  substitute_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE faculty_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitutions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin has full access
CREATE POLICY "Admin full access absences" ON faculty_absences FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');
CREATE POLICY "Admin full access substitutions" ON substitutions FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Public read access (for dashboards)
CREATE POLICY "Public read absences" ON faculty_absences FOR SELECT USING (true);
CREATE POLICY "Public read substitutions" ON substitutions FOR SELECT USING (true);
