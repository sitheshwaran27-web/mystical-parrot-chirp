import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { batch_id, mode } = await req.json()
    console.log(`[ai-timetable-engine] Starting ${mode} generation for batch: ${batch_id}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. DATA COLLECTION
    const { data: batch } = await supabase.from('batches').select('*').eq('id', batch_id).single()
    const { data: subjects } = await supabase.from('subjects').select('*').eq('year', batch.year).eq('semester', batch.semester)
    const { data: faculty } = await supabase.from('faculty').select('*')
    const { data: history } = await supabase.from('schedule_slots').select('*').not('faculty_id', 'is', null).limit(100)

    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    const TIMES = ["08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"]

    // 2. AI LOGIC: HEURISTIC SCORING
    const generateOptimizedSlots = () => {
      const slots = []
      const facultyWorkload = new Map()

      for (const day of DAYS) {
        for (const time of TIMES) {
          // Find best Faculty-Subject pair using Scoring
          let bestPair = null
          let maxScore = -Infinity

          for (const sub of subjects) {
            for (const fac of faculty) {
              let score = 0
              
              // HEURISTIC 1: Historical Preference (AI Learning)
              const histMatch = history.find(h => h.faculty_id === fac.id && h.subject_id === sub.id && h.day === day)
              if (histMatch) score += 15

              // HEURISTIC 2: Workload Balancing
              const currentLoad = facultyWorkload.get(fac.id) || 0
              score -= (currentLoad * 5) // Penalty for overloading

              // HEURISTIC 3: Consecutive Class Prevention
              if (slots.length > 0 && slots[slots.length-1].faculty_id === fac.id) score -= 10

              if (score > maxScore) {
                maxScore = score
                bestPair = { sub, fac, score }
              }
            }
          }

          slots.push({
            day,
            time_slot: time,
            class_name: batch.name,
            subject_id: bestPair.sub.id,
            faculty_id: bestPair.fac.id,
            ai_score: bestPair.score,
            type: bestPair.sub.type
          })

          facultyWorkload.set(bestPair.fac.id, (facultyWorkload.get(bestPair.fac.id) || 0) + 1)
        }
      }
      return slots
    }

    const newSlots = generateOptimizedSlots()

    // 3. APPLY TO DB
    if (mode === 'full') {
      await supabase.from('schedule_slots').delete().eq('class_name', batch.name)
    }
    
    const { error } = await supabase.from('schedule_slots').insert(newSlots)
    if (error) throw error

    return new Response(JSON.stringify({ success: true, message: "AI Generation Complete" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})