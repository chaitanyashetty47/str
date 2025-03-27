import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zunoqjiwhyzimcayolyu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bm9xaml3aHl6aW1jYXlvbHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2MjY5ODAsImV4cCI6MjAyNTIwMjk4MH0.GJ6UmqZKhEYa7jEMJrYhZLFXGhBy_5JKEkEcgKDEVKE'
)

async function getWorkoutPlans() {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Workout Plans:', JSON.stringify(data, null, 2))
}

getWorkoutPlans() 