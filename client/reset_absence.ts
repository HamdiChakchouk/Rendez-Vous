import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../client/.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    console.log('Resetting appointments and absence...');
    
    // Find Hamdi
    const { data: hamdi } = await supabase.from('employes').select('id').ilike('nom_employe', '%Hamdi%').single();
    if (!hamdi) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Reset absence to pending
    await supabase.from('absences')
        .update({ statut: 'pending' })
        .eq('employe_id', hamdi.id)
        .eq('date_debut', today)
        .eq('type', 'Congé annuel');
        
    // Reset appointments to confirmed
    await supabase.from('rendez_vous')
        .update({ statut: 'confirmed' })
        .eq('employe_id', hamdi.id)
        .eq('date_rdv', today)
        .in('heure_rdv', ['14:00:00', '15:30:00', '16:00:00', '17:00:00']);
        
    console.log('Reset done!');
}
main();
