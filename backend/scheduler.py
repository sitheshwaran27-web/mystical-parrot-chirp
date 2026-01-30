import random
import numpy as np

class TimetableScheduler:
    def __init__(self, subjects, faculty, constraints, periods_per_day=7, days=5):
        self.subjects = subjects  # List of subject dicts with weekly_hours
        self.faculty = faculty    # List of faculty dicts
        self.constraints = constraints
        self.periods_per_day = periods_per_day
        self.days = days
        self.population_size = 50
        self.generations = 100
        self.mutation_rate = 0.1

    def generate_initial_population(self):
        population = []
        for _ in range(self.population_size):
            schedule = self.create_random_schedule()
            population.append(schedule)
        return population

    def create_random_schedule(self):
        # A schedule is a list of slots: (day, period, subject_id, faculty_id)
        schedule = []
        all_slots = [(d, p) for d in range(self.days) for p in range(self.periods_per_day)]
        random.shuffle(all_slots)
        
        # Flattened list of subject hours to allocate
        allocation_pool = []
        for sub in self.subjects:
            for _ in range(sub.get('weekly_hours', 3)):
                allocation_pool.append(sub)
        
        for i, sub in enumerate(allocation_pool):
            if i >= len(all_slots): break
            day, period = all_slots[i]
            # Assign corresponding faculty
            fac = next((f for f in self.faculty if f['id'] == sub['faculty_id']), None)
            schedule.append({
                'day': day,
                'period': period,
                'subject_id': sub['id'],
                'subject_name': sub['name'],
                'faculty_id': fac['id'] if fac else None,
                'faculty_name': fac['name'] if fac else "Unknown"
            })
        return schedule

    def fitness(self, schedule):
        score = 1000
        # Hard Constraints: 
        # 1. Faculty Overlap (Check if faculty is in two places at once - across schedules, 
        #    but here we only fitness one schedule. External overlaps handled by global check)
        
        # 2. Local conflicts (Subject overlap in same slot - avoided by structure)
        
        # Soft Constraints:
        # 1. Balanced workload (not too many hard subjects in one day)
        # 2. Minimal gaps
        
        day_counts = {}
        for slot in schedule:
            d = slot['day']
            day_counts[d] = day_counts.get(d, 0) + 1
            
        # Penalize uneven distribution
        counts = list(day_counts.values())
        if counts:
            score -= np.std(counts) * 10
            
        return score

    def evolve(self):
        population = self.generate_initial_population()
        for g in range(self.generations):
            population = sorted(population, key=lambda x: self.fitness(x), reverse=True)
            new_pop = population[:10] # Elitism
            
            while len(new_pop) < self.population_size:
                parent1 = random.choice(population[:20])
                parent2 = random.choice(population[:20])
                child = self.crossover(parent1, parent2)
                if random.random() < self.mutation_rate:
                    self.mutate(child)
                new_pop.append(child)
            population = new_pop
        return population[0]

    def crossover(self, p1, p2):
        # Simple point crossover
        split = random.randint(0, len(p1))
        return p1[:split] + p2[split:]

    def mutate(self, schedule):
        if not schedule: return
        idx = random.randint(0, len(schedule)-1)
        # Swap day/period with a random empty one or another slot
        d = random.randint(0, self.days-1)
        p = random.randint(0, self.periods_per_day-1)
        schedule[idx]['day'] = d
        schedule[idx]['period'] = p
