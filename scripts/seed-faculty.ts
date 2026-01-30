import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bcfkkrfrzutbmhdbosaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZmtrcmZyenV0Ym1oZGJvc2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDY3NDIsImV4cCI6MjA4MzAyMjc0Mn0.ZdvPAHk-vxlVQuO39q4wU0Zb05xrjnlRJEiJOdMGmY0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedFaculty() {
    console.log('Adding faculty member...');

    // First, get a department to assign (required field)
    const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('name')
        .limit(1);

    if (deptError) {
        console.error('Error fetching departments:', deptError);
        return;
    }

    const departmentName = departments?.[0]?.name || 'Computer Science';
    console.log('Using department:', departmentName);

    // Check if faculty already exists
    const { data: existing } = await supabase
        .from('faculty')
        .select('id, email')
        .eq('email', 'sitheshwaran1234@gmail.com')
        .single();

    if (existing) {
        console.log('Faculty member already exists!');
        console.log('ID:', existing.id);
        console.log('Email:', existing.email);
        return;
    }

    // Insert faculty record
    const { data, error } = await supabase
        .from('faculty')
        .insert([
            {
                name: 'Sitheshwaran',
                email: 'sitheshwaran1234@gmail.com',
                priority: 'senior',
                department: departmentName,
                designation: 'Professor',
            }
        ])
        .select();

    if (error) {
        console.error('Error inserting faculty:', error);
        return;
    }

    console.log('✅ Faculty member added successfully!');
    console.log('Data:', data);
    console.log('\n--- Faculty Details ---');
    console.log('Name: Sitheshwaran');
    console.log('Email: sitheshwaran1234@gmail.com');
    console.log('Department:', departmentName);
    console.log('\n⚠️  To enable login with password 1234567890:');
    console.log('1. Go to Faculty Management in admin panel');
    console.log('2. Find this faculty member and click Edit');
    console.log('3. Enter password: 1234567890');
    console.log('4. Click Save Changes');
}

seedFaculty().catch(console.error);
