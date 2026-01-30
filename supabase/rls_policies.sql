-- Enable RLS on all tables (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Allow users to read all profiles (role check transparency)
-- This avoids recursive loops during the login redirect
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

CREATE POLICY "Allow authenticated users to read profiles" ON profiles
FOR SELECT TO authenticated
USING ( true );

-- Allow users to initialize their own profile (self-heal)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Admins can manage all profiles" ON profiles
FOR ALL TO authenticated
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- 2. Students
DROP POLICY IF EXISTS "Admins can manage students" ON students;
CREATE POLICY "Admins can manage students" ON students
FOR ALL TO authenticated
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Authenticated users can view students" ON students
FOR SELECT TO authenticated
USING ( true );

-- 3. Faculty
DROP POLICY IF EXISTS "Admins can manage faculty" ON faculty;
CREATE POLICY "Admins can manage faculty" ON faculty
FOR ALL TO authenticated
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Authenticated users can view faculty" ON faculty
FOR SELECT TO authenticated
USING ( true );

-- 4. Departments
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
CREATE POLICY "Admins can manage departments" ON departments
FOR ALL TO authenticated
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Authenticated users can view departments" ON departments
FOR SELECT TO authenticated
USING ( true );

-- 5. Batches
DROP POLICY IF EXISTS "Admins can manage batches" ON batches;
CREATE POLICY "Admins can manage batches" ON batches
FOR ALL TO authenticated
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Authenticated users can view batches" ON batches
FOR SELECT TO authenticated
USING ( true );

-- 6. Subjects
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
CREATE POLICY "Admins can manage subjects" ON subjects
FOR ALL TO authenticated
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Authenticated users can view subjects" ON subjects
FOR SELECT TO authenticated
USING ( true );

-- 7. Schedule Slots
DROP POLICY IF EXISTS "Admins can manage schedule_slots" ON schedule_slots;
CREATE POLICY "Admins can manage schedule_slots" ON schedule_slots
FOR ALL TO authenticated
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Authenticated users can view schedule_slots" ON schedule_slots
FOR SELECT TO authenticated
USING ( true );

-- 8. AI Preferences
DROP POLICY IF EXISTS "Admins can manage ai_preferences" ON ai_preferences;
CREATE POLICY "Admins can manage ai_preferences" ON ai_preferences
FOR ALL TO authenticated
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );
