import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    // Vérifier les variables Twilio (sans exposer les valeurs réelles)
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    const envStatus = {
        TWILIO_ACCOUNT_SID: twilioSid ? `✅ Set (${twilioSid.slice(0, 6)}...)` : '❌ MISSING',
        TWILIO_AUTH_TOKEN: twilioToken ? `✅ Set (${twilioToken.slice(0, 4)}...)` : '❌ MISSING',
        TWILIO_PHONE_NUMBER: twilioPhone ? `✅ Set (${twilioPhone})` : '❌ MISSING',
    };

    // Tester Twilio en live
    let twilioTest = '❌ Not tested';
    if (twilioSid && twilioToken && twilioPhone) {
        try {
            const twilio = (await import('twilio')).default;
            const client = twilio(twilioSid, twilioToken);
            // Juste valider les credentials (pas envoyer un SMS)
            const account = await client.api.accounts(twilioSid).fetch();
            twilioTest = `✅ Credentials valid — Account: ${account.friendlyName} (${account.status})`;
        } catch (err: any) {
            twilioTest = `❌ Twilio Error: ${err.message}`;
        }
    } else {
        twilioTest = '❌ Cannot test — missing env vars';
    }

    // Chercher le numéro de hamdi dans la base
    const { data: clients, error } = await supabaseAdmin
        .from('clients')
        .select('id, telephone, nom_client, expo_push_token, created_at')
        .like('telephone', '%58350307%');

    // Chercher aussi dans profiles si lié à google
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, role, created_at')
        .limit(5);

    // Chercher l'utilisateur Supabase Auth avec l'email google
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const hamdi = users?.find(u => u.email === 'chakchouk.hamdi@gmail.com');

    return NextResponse.json({
        envStatus,
        twilioTest,
        clientsWithNumber: clients || [],
        clientError: error?.message,
        hamdiAuthUser: hamdi ? {
            id: hamdi.id,
            email: hamdi.email,
            phone: hamdi.phone,
            provider: hamdi.app_metadata?.provider,
            created_at: hamdi.created_at,
        } : 'NOT FOUND in auth.users',
        profilesSample: profiles || [],
    }, { status: 200 });
}
