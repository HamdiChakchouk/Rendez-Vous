import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../client/.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSonia() {
    // 1. Find user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) return console.error(userError);

    const sonia = users.find(u => u.email === 'sonia@test.tn');
    if (!sonia) return console.log("Sonia not found");

    console.log("Sonia ID:", sonia.id);
    console.log("Sonia App Metadata:", sonia.app_metadata);

    // 2. Check profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', sonia.id).single();
    console.log("Profile:", profile);

    // 3. Check employes
    if (profile?.salon_id) {
        const { data: employes } = await supabase.from('employes').select('*').eq('salon_id', profile.salon_id);
        console.log("Employes in salon:", employes);
    }
}

checkSonia();
