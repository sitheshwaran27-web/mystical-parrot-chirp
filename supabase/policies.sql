-- Enable RLS on all tables (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Allow admins to fully manage profiles, users to read own
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL TO authenticated
  USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
  WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING ( auth.uid() = id );

-- 2. Students
DROP POLICY IF EXISTS "Admins can manage students" ON students;
CREATE POLICY "Admins can manage students" ON students
  FOR ALL TO authenticated
  USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
  WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- 3. Faculty
DROP POLICY IF EXISTS "Admins can manage faculty" ON faculty;
CREATE POLICY "Admins can manage faculty" ON faculty
  FOR ALL TO authenticated
  USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
  WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Authenticated users can read faculty" ON faculty;
CREATE POLICY "Authenticated users can read faculty" ON faculty
  FOR SELECT TO authenticated
  USING (true);

-- 4. Departments
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL TO authenticated
  USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
  WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- 5. Batches
DROP POLICY IF EXISTS "Admins can manage batches" ON batches;
CREATE POLICY "Admins can manage batches" ON batches
  FOR ALL TO authenticated
  USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
  WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- 6. Subjects
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
CREATE POLICY "Admins can manage subjects" ON subjects
  FOR ALL TO authenticated
  USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
  WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Authenticated users can read subjects" ON subjects;
CREATE POLICY "Authenticated users can read subjects" ON subjects
  FOR SELECT TO authenticated
  USING (true);

-- 7. Schedule Slots
DROP POLICY IF EXISTS "Admins can manage schedule_slots" ON schedule_slots;
CREATE POLICY "Admins can manage schedule_slots" ON schedule_slots
  FOR ALL TO authenticated
  USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
  WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Authenticated users can read schedule_slots" ON schedule_slots;
CREATE POLICY "Authenticated users can read schedule_slots" ON schedule_slots
  FOR SELECT TO authenticated
  USING (true);

-- 8. AI Preferences
DROP POLICY IF EXISTS "Admins can manage ai_preferences" ON ai_preferences;
CREATE POLICY "Admins can manage ai_preferences" ON ai_preferences
  FOR ALL TO authenticated
  USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
  WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );
