-- 0. Helper Function to check role without recursion
-- SECURITY DEFINER bypasses RLS, allowing us to lookup roles safely
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles: Allow users to read all profiles (role check transparency)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Allow authenticated users to read profiles" ON profiles
FOR SELECT TO authenticated
USING ( true );

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Admins can manage all profiles" ON profiles
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

-- 2. Students
DROP POLICY IF EXISTS "Admins can manage students" ON students;
CREATE POLICY "Admins can manage students" ON students
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

CREATE POLICY "Authenticated users can view students" ON students
FOR SELECT TO authenticated
USING ( true );

-- 3. Faculty
DROP POLICY IF EXISTS "Admins can manage faculty" ON faculty;
CREATE POLICY "Admins can manage faculty" ON faculty
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

CREATE POLICY "Authenticated users can view faculty" ON faculty
FOR SELECT TO authenticated
USING ( true );

-- 4. Departments
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
CREATE POLICY "Admins can manage departments" ON departments
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

CREATE POLICY "Authenticated users can view departments" ON departments
FOR SELECT TO authenticated
USING ( true );

-- 5. Batches
DROP POLICY IF EXISTS "Admins can manage batches" ON batches;
CREATE POLICY "Admins can manage batches" ON batches
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

CREATE POLICY "Authenticated users can view batches" ON batches
FOR SELECT TO authenticated
USING ( true );

-- 6. Subjects
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
CREATE POLICY "Admins can manage subjects" ON subjects
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

CREATE POLICY "Authenticated users can view subjects" ON subjects
FOR SELECT TO authenticated
USING ( true );

-- 7. Schedule Slots
DROP POLICY IF EXISTS "Admins can manage schedule_slots" ON schedule_slots;
CREATE POLICY "Admins can manage schedule_slots" ON schedule_slots
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

CREATE POLICY "Authenticated users can view schedule_slots" ON schedule_slots
FOR SELECT TO authenticated
USING ( true );

-- 8. AI Preferences
DROP POLICY IF EXISTS "Admins can manage ai_preferences" ON ai_preferences;
CREATE POLICY "Admins can manage ai_preferences" ON ai_preferences
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );
