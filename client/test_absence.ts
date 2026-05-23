import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from client directory
dotenv.config({ path: path.join(__dirname, '../client/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Fetching Hamdi employee data...');
    
    // Find Hamdi
    const { data: hamdi, error: errEmp } = await supabase
        .from('employes')
        .select('*')
        .ilike('nom_employe', '%Hamdi%')
        .single();
        
    if (errEmp || !hamdi) {
        console.error('Hamdi not found', errEmp);
        return;
    }
    console.log('Found Hamdi:', hamdi.id, 'Salon ID:', hamdi.salon_id);

    // Find a service
    const { data: service } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', hamdi.salon_id)
        .limit(1)
        .single();
        
    if (!service) {
        console.error('No service found for salon');
        return;
    }
    
    // Find or create a client
    const phone = '00000000';
    let clientId;
    const { data: client } = await supabase.from('clients').select('id').eq('telephone', phone).maybeSingle();
    
    if (client) {
        clientId = client.id;
    } else {
        const { data: newClient } = await supabase.from('clients').insert({
            telephone: phone,
            nom_client: 'Client Test Conflit'
        }).select('id').single();
        clientId = newClient?.id;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Creating appointments in the afternoon...');
    const times = ['14:00:00', '15:30:00', '16:00:00', '17:00:00'];
    
    for (const time of times) {
        const { error: rdvErr } = await supabase.from('rendez_vous').insert({
            salon_id: hamdi.salon_id,
            client_id: clientId,
            service_id: service.id,
            employe_id: hamdi.id,
            date_rdv: today,
            heure_rdv: time,
            statut: 'confirmed'
        });
        
        if (rdvErr) console.error(`RDV Error at ${time}:`, rdvErr);
        else console.log(`Appointment created successfully at ${time}!`);
    }
    
    console.log('Creating pending absence from 15:00 to 16:30...');
    // Create a pending absence for Hamdi today 15:00 to 16:30
    const { error: absErr } = await supabase.from('absences').insert({
        employe_id: hamdi.id,
        salon_id: hamdi.salon_id,
        type: 'Congé annuel',
        date_debut: today,
        date_fin: today,
        is_half_day: true,
        heure_debut: '15:00',
        heure_fin: '16:30',
        statut: 'pending',
        commentaire: 'Test de chevauchement'
    });
    
    if (absErr) console.error('Absence Error:', absErr);
    else console.log('Absence created successfully!');
    
    console.log('Done!');
}

main();
