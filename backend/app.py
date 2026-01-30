from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
from scheduler import TimetableScheduler
from exam_scheduler import ExamScheduler

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Supabase Setup
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")

# Direct REST Client Helper
def supabase_request(table, params=None):
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    target_url = f"{url}/rest/v1/{table}"
    response = requests.get(target_url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "message": "AI Timetable Backend is running (REST mode)"
    })

@app.route('/api/generate-timetable', methods=['POST'])
def generate_timetable():
    data = request.json
    batch_name = data.get('batch_name')
    
    if not batch_name:
        return jsonify({"error": "batch_name is required"}), 400

    try:
        # 1. Fetch Batch to get department_id
        batches = supabase_request("batches", params={"name": f"eq.{batch_name}"})
        if not batches:
            return jsonify({"error": "Batch not found"}), 404
        
        batch = batches[0]
        dept_id = batch.get('department_id')
        
        # 2. Fetch Subjects and Faculty for this department
        subjects = supabase_request("subjects", params={"department_id": f"eq.{dept_id}"})
        faculty = supabase_request("faculty", params={"department_id": f"eq.{dept_id}"})
        
        if not subjects or not faculty:
            return jsonify({"error": "Insufficient data (subjects or faculty) to generate timetable"}), 400

        # 3. Initialize and run Scheduler
        scheduler = TimetableScheduler(subjects, faculty, constraints={})
        opt_schedule = scheduler.evolve()
        
        return jsonify({
            "success": True,
            "batch_name": batch_name,
            "slots": opt_schedule
        })

    except Exception as e:
        print(f"Generation error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-exam-timetable', methods=['POST'])
def generate_exam_timetable():
    data = request.json
    exam_id = data.get('exam_id')
    
    if not exam_id:
        return jsonify({"error": "exam_id is required"}), 400

    try:
        # 1. Fetch Exam Config
        exams = supabase_request("exams", params={"id": f"eq.{exam_id}"})
        if not exams:
            return jsonify({"error": "Exam not found"}), 404
        exam_config = exams[0]
        
        # 2. Fetch all Halls, Faculty, Subjects (Simplified for prototype)
        # In production, you would filter subjects by department or selected IDs
        halls = supabase_request("exam_halls")
        faculty = supabase_request("faculty")
        subjects = supabase_request("subjects") 
        # Note: We need batch_id in subjects to separate batches. 
        # If subjects table doesn't have batch_id directly (it might be in relation), 
        # we might need to fetch differently.
        # For now assuming subjects has batch_id or we fetch slots.
        # Let's try to fetch subjects with batch info.
        
        if not subjects or not faculty or not halls:
             return jsonify({"error": "Missing data (subjects, faculty, or halls)"}), 400

        # 3. Initialize and run Scheduler
        scheduler = ExamScheduler(exam_config, subjects, halls, faculty)
        schedule = scheduler.generate()
        
        return jsonify({
            "success": True,
            "exam_name": exam_config['name'],
            "schedule": schedule
        })

    except Exception as e:
        print(f"Exam Generation error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/find-substitutes', methods=['POST'])
def find_substitutes():
    data = request.json
    date_str = data.get('date')       # YYYY-MM-DD
    time_slot = data.get('time_slot') # e.g. "09:30 - 10:30"
    day_of_week = data.get('day')     # e.g. "Monday"
    
    if not date_str or not time_slot or not day_of_week:
        return jsonify({"error": "Missing params"}), 400

    try:
        # 1. Fetch Candidates (All Faculty)
        all_faculty = supabase_request("faculty")
        if not all_faculty:
            return jsonify({"recommendations": []})

        # 2. Fetch Schedule Slots for this DAY (to check conflicts)
        # Assuming supabase_request handles simple filters. 
        # Using exact match for day.
        params = {"day": f"eq.{day_of_week}"}
        slots_on_day = supabase_request("schedule_slots", params=params) or []

        # 3. Fetch Substitutions for this DATE (to check conflicts)
        params_sub = {"date": f"eq.{date_str}"}
        subs_on_date = supabase_request("substitutions", params=params_sub) or []

        candidates = []
        
        for f in all_faculty:
            f_id = f['id']
            f_name = f['name']
            
            # Check availability
            is_busy = False
            conflict_reason = None
            
            # Check regular schedule
            for slot in slots_on_day:
                if slot['faculty_id'] == f_id and slot['time_slot'] == time_slot:
                    is_busy = True
                    conflict_reason = f"Regular class: {slot.get('class_name', '')}"
                    break
            
            # Check existing substitution duties
            if not is_busy:
                for sub in subs_on_date:
                    if sub['substitute_faculty_id'] == f_id:
                        # Find the slot details for this sub (we might need to fetch it or infer time)
                        # The substitution record links to `schedule_slot_id`.
                        # We need to consider if that slot matches `time_slot`.
                        # This is tricky without joining. 
                        # Simplification: If they have ANY substitution on that day, 
                        # we might mark them as 'busier', but strictly we need to know the time.
                        # For prototype, let's assume if they are subbing, they are busy if we can't check time.
                        # OR better: We skip this check if we can't verify time, but mark workload up.
                        pass
        
            # Calculate Workload Score (classes on this day)
            # Count regular slots + substitutions
            workload = 0
            for slot in slots_on_day:
                if slot['faculty_id'] == f_id:
                    workload += 1
            
            # Add existing subs to workload
            for sub in subs_on_date:
                if sub['substitute_faculty_id'] == f_id:
                    workload += 1

            candidates.append({
                "faculty_id": f_id,
                "faculty_name": f_name,
                "department": f.get('department_id', 'Unknown'), # or fetch Name
                "workload_score": workload,
                "is_free": not is_busy,
                "conflict_reason": conflict_reason
            })

        # Rank: Free first, then by workload (low to high)
        ranked = sorted(candidates, key=lambda x: (not x['is_free'], x['workload_score']))
        
        # Filter to only show free candidates or top 5
        # showing all for now but Free ones first
        
        return jsonify({"recommendations": ranked})

    except Exception as e:
        print(f"Substitute finding error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
