-- System Settings Table for Institution-Wide Configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Timetable Results Table
CREATE TABLE IF NOT EXISTS timetable_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by UUID REFERENCES auth.users(id),
    schedule_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    ai_score DECIMAL(5,2),
    conflicts_resolved INTEGER DEFAULT 0
);

-- Generation Logs for AI Progress Tracking
CREATE TABLE IF NOT EXISTS generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID REFERENCES timetable_results(id) ON DELETE CASCADE,
    log_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    log_level VARCHAR(20),
    message TEXT,
    metadata JSONB
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_settings
DROP POLICY IF EXISTS "Admins can manage system_settings" ON system_settings;
CREATE POLICY "Admins can manage system_settings" ON system_settings
    FOR ALL TO authenticated
    USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
    WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "All authenticated users can read system_settings" ON system_settings;
CREATE POLICY "All authenticated users can read system_settings" ON system_settings
    FOR SELECT TO authenticated
    USING (true);

-- RLS Policies for timetable_results
DROP POLICY IF EXISTS "Admins can manage timetable_results" ON timetable_results;
CREATE POLICY "Admins can manage timetable_results" ON timetable_results
    FOR ALL TO authenticated
    USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
    WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "All authenticated users can read timetable_results" ON timetable_results;
CREATE POLICY "All authenticated users can read timetable_results" ON timetable_results
    FOR SELECT TO authenticated
    USING (true);

-- RLS Policies for generation_logs
DROP POLICY IF EXISTS "Admins can manage generation_logs" ON generation_logs;
CREATE POLICY "Admins can manage generation_logs" ON generation_logs
    FOR ALL TO authenticated
    USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' )
    WITH CHECK ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "All authenticated users can read generation_logs" ON generation_logs;
CREATE POLICY "All authenticated users can read generation_logs" ON generation_logs
    FOR SELECT TO authenticated
    USING (true);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value) VALUES
    ('college_timings', '{"start_time": "09:00", "end_time": "16:30", "num_periods": 7, "period_duration": 50, "break_gap": 0, "lab_duration": 3}'::jsonb),
    ('breaks', '[{"id": "1", "name": "Short Break", "start": "11:00", "end": "11:15", "type": "short"}, {"id": "2", "name": "Lunch Break", "start": "12:30", "end": "13:30", "type": "lunch"}]'::jsonb),
    ('working_days', '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
