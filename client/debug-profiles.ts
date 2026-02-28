import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function debugProfiles() {
  console.log('--- ADMINS ---')
  const { data: admins } = await supabase.from('admins').select('email, nom_admin, salon_id, user_id')
  console.table(admins)

  console.log('\n--- EMPLOYEES ---')
  const { data: employees } = await supabase.from('employes').select('nom_employe, salon_id, user_id')
  console.table(employees)

  console.log('\n--- SALONS ---')
  const { data: salons } = await supabase.from('salons').select('id, nom_salon')
  console.table(salons)
}

debugProfiles()
