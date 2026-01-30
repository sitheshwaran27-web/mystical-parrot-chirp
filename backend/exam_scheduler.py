
import random
from datetime import datetime, timedelta

class ExamScheduler:
    def __init__(self, exam_config, subjects, halls, faculty):
        self.exam_config = exam_config
        self.subjects = subjects  # List of {id, name, batch_id, student_count}
        self.halls = halls        # List of {id, name, capacity}
        self.faculty = faculty    # List of {id, name, department}
        
    def generate(self):
        start_date = datetime.strptime(self.exam_config['start_date'], '%Y-%m-%d')
        end_date = datetime.strptime(self.exam_config['end_date'], '%Y-%m-%d')
        
        # Generates list of available slots: (date, session)
        available_slots = []
        curr_date = start_date
        while curr_date <= end_date:
            if curr_date.weekday() != 6: # Skip Sundays (6)
                available_slots.append({'date': curr_date.strftime('%Y-%m-%d'), 'session': 'Morning'})
                available_slots.append({'date': curr_date.strftime('%Y-%m-%d'), 'session': 'Afternoon'})
            curr_date += timedelta(days=1)
            
        schedule = []
        
        # Group subjects by batch to ensure no batch has 2 exams at once
        batch_subjects = {}
        for sub in self.subjects:
            bid = sub.get('batch_id', 'unknown')
            if bid not in batch_subjects:
                batch_subjects[bid] = []
            batch_subjects[bid].append(sub)
            
        # Schedule each batch's exams
        for batch_id, subs in batch_subjects.items():
            # Shuffle subjects for randomness
            random.shuffle(subs)
            
            # Spread exams across available days
            # Simple strategy: 1 exam per day if possible
            
            # Filter valid slots for this batch (avoid conflicts)
            # Since we iterate batch by batch, valid slots are all slots 
            # BUT we must assign specific slots to avoid overlap if batches share students?
            # Assuming batches are independent sets of students.
            
            slot_idx = 0
            # Try to space them out (e.g. every other slot or day)
            step = 2 if len(available_slots) >= len(subs) * 2 else 1
            
            for sub in subs:
                if slot_idx >= len(available_slots):
                    break # No more slots!
                
                slot = available_slots[slot_idx]
                
                # Assign Hall
                # Find a hall with enough capacity
                # For simplicity, pick random valid hall
                # Real logic needs to track hall usage per slot
                student_count = sub.get('student_count', 30) # Default 30 if unknown
                valid_halls = [h for h in self.halls if h['capacity'] >= student_count]
                
                assigned_hall = random.choice(valid_halls) if valid_halls else None
                
                # Assign Invigilator
                # Pick random faculty
                invigilator = random.choice(self.faculty) if self.faculty else None
                
                schedule.append({
                    'exam_id': self.exam_config['id'],
                    'subject_id': sub['id'],
                    'subject_name': sub['name'],
                    'batch_id': batch_id,
                    'exam_date': slot['date'],
                    'session': slot['session'],
                    'hall_id': assigned_hall['id'] if assigned_hall else None,
                    'hall_name': assigned_hall['name'] if assigned_hall else "TBD",
                    'invigilator_id': invigilator['id'] if invigilator else None,
                    'invigilator_name': invigilator['name'] if invigilator else "TBD"
                })
                
                slot_idx += step
                
        return schedule
