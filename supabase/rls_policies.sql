-- 0. Helper Function (Keep this for other tables)
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

-- 1. Profiles: RECURSION-PROOF POLICIES
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are readable by all" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Profiles are readable by all" ON profiles
FOR SELECT TO authenticated
USING ( true );

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING ( auth.uid() = id );

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK ( auth.uid() = id );

-- 2. Students
DROP POLICY IF EXISTS "Admins can manage students" ON students;
DROP POLICY IF EXISTS "Authenticated users can view students" ON students;

CREATE POLICY "Admins can manage students" ON students
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

CREATE POLICY "Authenticated users can view students" ON students
FOR SELECT TO authenticated
USING ( true );

-- 3. Faculty
DROP POLICY IF EXISTS "Admins can manage faculty" ON faculty;
DROP POLICY IF EXISTS "Authenticated users can view faculty" ON faculty;

CREATE POLICY "Admins can manage faculty" ON faculty
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

CREATE POLICY "Authenticated users can view faculty" ON faculty
FOR SELECT TO authenticated
USING ( true );

-- 4. Departments
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON departments;

CREATE POLICY "Admins can manage departments" ON departments
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

CREATE POLICY "Authenticated users can view departments" ON departments
FOR SELECT TO authenticated
USING ( true );

-- 5. Batches
DROP POLICY IF EXISTS "Admins can manage batches" ON batches;
DROP POLICY IF EXISTS "Authenticated users can view batches" ON batches;

CREATE POLICY "Admins can manage batches" ON batches
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

CREATE POLICY "Authenticated users can view batches" ON batches
FOR SELECT TO authenticated
USING ( true );

-- 6. Subjects
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
DROP POLICY IF EXISTS "Authenticated users can view subjects" ON subjects;

CREATE POLICY "Admins can manage subjects" ON subjects
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

CREATE POLICY "Authenticated users can view subjects" ON subjects
FOR SELECT TO authenticated
USING ( true );

-- 7. Schedule Slots
DROP POLICY IF EXISTS "Admins can manage schedule_slots" ON schedule_slots;
DROP POLICY IF EXISTS "Authenticated users can view schedule_slots" ON schedule_slots;

CREATE POLICY "Admins can manage schedule_slots" ON schedule_slots
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

CREATE POLICY "Authenticated users can view schedule_slots" ON schedule_slots
FOR SELECT TO authenticated
USING ( true );

-- 8. AI Preferences
DROP POLICY IF EXISTS "Admins can manage ai_preferences" ON ai_preferences;
DROP POLICY IF EXISTS "Authenticated users can view own preferences" ON ai_preferences; -- Added just in case

CREATE POLICY "Admins can manage ai_preferences" ON ai_preferences
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );
