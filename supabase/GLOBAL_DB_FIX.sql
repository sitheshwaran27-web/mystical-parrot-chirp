-- =========================================================
-- GLOBAL SUPABASE RLS OVERHAUL (RECURSION-PROOF)
-- =========================================================

-- 0. SUPER HELPER (SECURITY DEFINER bypasses RLS)
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

-- 1. PROFILES (THE ROOT OF RECURSION)
-- We open select to all authenticated users so it NEVER hangs.
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are readable by all" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Profiles are readable by all" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin manage all" ON profiles FOR ALL TO authenticated USING (check_is_admin());

-- 2. CORE TABLES (STUDENTS, FACULTY, ETC)
-- Systematically applying check_is_admin()

-- STUDENTS
DROP POLICY IF EXISTS "Admins can manage students" ON students;
DROP POLICY IF EXISTS "Authenticated users can view students" ON students;
CREATE POLICY "Admin manage" ON students FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON students FOR SELECT TO authenticated USING (true);

-- FACULTY
DROP POLICY IF EXISTS "Admins can manage faculty" ON faculty;
DROP POLICY IF EXISTS "Authenticated users can view faculty" ON faculty;
DROP POLICY IF EXISTS "Authenticated users can read faculty" ON faculty;
CREATE POLICY "Admin manage" ON faculty FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON faculty FOR SELECT TO authenticated USING (true);

-- DEPARTMENTS
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON departments;
CREATE POLICY "Admin manage" ON departments FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON departments FOR SELECT TO authenticated USING (true);

-- BATCHES
DROP POLICY IF EXISTS "Admins can manage batches" ON batches;
DROP POLICY IF EXISTS "Authenticated users can view batches" ON batches;
CREATE POLICY "Admin manage" ON batches FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON batches FOR SELECT TO authenticated USING (true);

-- SUBJECTS
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
DROP POLICY IF EXISTS "Authenticated users can view subjects" ON subjects;
DROP POLICY IF EXISTS "Authenticated users can read subjects" ON subjects;
CREATE POLICY "Admin manage" ON subjects FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON subjects FOR SELECT TO authenticated USING (true);

-- SCHEDULE SLOTS
DROP POLICY IF EXISTS "Admins can manage schedule_slots" ON schedule_slots;
DROP POLICY IF EXISTS "Authenticated users can view schedule_slots" ON schedule_slots;
DROP POLICY IF EXISTS "Authenticated users can read schedule_slots" ON schedule_slots;
CREATE POLICY "Admin manage" ON schedule_slots FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON schedule_slots FOR SELECT TO authenticated USING (true);

-- 3. EXAM TABLES
-- EXAMS
DROP POLICY IF EXISTS "Admins full access exams" ON exams;
DROP POLICY IF EXISTS "Authenticated read exams" ON exams;
CREATE POLICY "Admin manage" ON exams FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON exams FOR SELECT TO authenticated USING (true);

-- EXAM HALLS
DROP POLICY IF EXISTS "Admins full access exam_halls" ON exam_halls;
DROP POLICY IF EXISTS "Authenticated read exam_halls" ON exam_halls;
CREATE POLICY "Admin manage" ON exam_halls FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON exam_halls FOR SELECT TO authenticated USING (true);

-- EXAM SCHEDULES
DROP POLICY IF EXISTS "Admins full access exam_schedules" ON exam_schedules;
DROP POLICY IF EXISTS "Authenticated read exam_schedules" ON exam_schedules;
CREATE POLICY "Admin manage" ON exam_schedules FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON exam_schedules FOR SELECT TO authenticated USING (true);

-- INVIGILATION DUTIES
DROP POLICY IF EXISTS "Admins full access invigilation_duties" ON invigilation_duties;
DROP POLICY IF EXISTS "Authenticated read invigilation_duties" ON invigilation_duties;
CREATE POLICY "Admin manage" ON invigilation_duties FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON invigilation_duties FOR SELECT TO authenticated USING (true);

-- 4. ABSENCE & LEAVE
-- FACULTY ABSENCES
DROP POLICY IF EXISTS "Admin full access absences" ON faculty_absences;
DROP POLICY IF EXISTS "Public read absences" ON faculty_absences;
CREATE POLICY "Admin manage" ON faculty_absences FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read self" ON faculty_absences FOR SELECT TO authenticated USING (auth.uid() = faculty_id OR check_is_admin());
CREATE POLICY "User insert self" ON faculty_absences FOR INSERT TO authenticated WITH CHECK (auth.uid() = faculty_id);

-- SUBSTITUTIONS
DROP POLICY IF EXISTS "Admin full access substitutions" ON substitutions;
DROP POLICY IF EXISTS "Public read substitutions" ON substitutions;
CREATE POLICY "Admin manage" ON substitutions FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON substitutions FOR SELECT TO authenticated USING (true);

-- 5. ANALYTICS & SETTINGS
-- SYSTEM SETTINGS
DROP POLICY IF EXISTS "Admins can manage system_settings" ON system_settings;
DROP POLICY IF EXISTS "All authenticated users can read system_settings" ON system_settings;
CREATE POLICY "Admin manage" ON system_settings FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON system_settings FOR SELECT TO authenticated USING (true);

-- TIMETABLE RESULTS
DROP POLICY IF EXISTS "Admins can manage timetable_results" ON timetable_results;
DROP POLICY IF EXISTS "All authenticated users can read timetable_results" ON timetable_results;
CREATE POLICY "Admin manage" ON timetable_results FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User read" ON timetable_results FOR SELECT TO authenticated USING (true);

-- AI PREFERENCES
DROP POLICY IF EXISTS "Admins can manage ai_preferences" ON ai_preferences;
CREATE POLICY "Admin manage" ON ai_preferences FOR ALL TO authenticated USING (check_is_admin());
CREATE POLICY "User manage self" ON ai_preferences FOR ALL TO authenticated 
  USING (auth.uid() = faculty_id) 
  WITH CHECK (auth.uid() = faculty_id);
