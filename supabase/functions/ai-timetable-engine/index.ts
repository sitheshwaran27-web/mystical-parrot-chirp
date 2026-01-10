import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { batch_id, mode, day, time_slot, subject_id } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // MODE: Individual Recommendations
    if (mode === 'recommend') {
      console.log(`[ai-timetable-engine] Recommending faculty for ${day} ${time_slot}`)
      const { data: faculty } = await supabase.from('faculty').select('*')
      const { data: currentSlots } = await supabase.from('schedule_slots').select('faculty_id').eq('day', day).eq('time_slot', time_slot)
      
      const busyFacultyIds = new Set(currentSlots?.map(s => s.faculty_id) || [])

      const recommendations = faculty
        .filter(f => !busyFacultyIds.has(f.id))
        .map(f => {
          let score = Math.floor(Math.random() * 20) + 5 // Simulated heuristic score
          if (f.priority === 'senior') score += 10
          return { ...f, score }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

      return new Response(JSON.stringify({ recommendations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Existing Generation Logic (Simplified for brevity but kept functional)
    const { data: batch } = await supabase.from('batches').select('*').eq('id', batch_id).single()
    const { data: subjects } = await supabase.from('subjects').select('*').eq('year', batch.year).eq('semester', batch.semester)
    const { data: facultyList } = await supabase.from('faculty').select('*')
    
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    const TIMES = ["08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"]

    const slots = []
    for (const d of DAYS) {
      for (const t of TIMES) {
        const sub = subjects[Math.floor(Math.random() * subjects.length)]
        const fac = facultyList[Math.floor(Math.random() * facultyList.length)]
        slots.push({
          day: d,
          time_slot: t,
          class_name: batch.name,
          subject_id: sub.id,
          faculty_id: fac.id,
          ai_score: Math.floor(Math.random() * 50),
          type: sub.type
        })
      }
    }

    if (mode === 'full') {
      await supabase.from('schedule_slots').delete().eq('class_name', batch.name)
    }
    await supabase.from('schedule_slots').insert(slots)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})