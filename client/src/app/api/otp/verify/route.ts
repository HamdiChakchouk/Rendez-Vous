import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createHash } from 'crypto';
import { ok, err } from '@/lib/api-response';

/** Hash un code OTP avec SHA-256 — doit correspondre à la fonction dans otp/send */
function hashOtp(code: string): string {
    return createHash('sha256').update(code).digest('hex');
}

export async function POST(req: Request) {
    try {
        const { phone, code, bookingData } = await req.json();

        if (!phone || !code) return err('Données manquantes', 400);

        // 1. Hasher le code reçu et chercher le hash correspondant en DB
        const codeHash = hashOtp(code);

        const { data: otpRecord, error: otpError } = await supabaseAdmin
            .from('otp_custom')
            .select('id')
            .eq('telephone', phone)
            .eq('code_otp', codeHash)           // ✅ Comparaison par hash
            .eq('verified', false)
            .gte('date_expiration', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (otpError || !otpRecord) {
            console.log(`[OTP Verify] No valid OTP for ${phone}`);
            return err('Code invalide ou expiré', 400);
        }

        // 2. Créer le RDV si les données de booking sont présentes
        if (bookingData?.salonId && bookingData?.serviceId && bookingData?.date && bookingData?.time) {

            // 2a. Validation : le service appartient bien au salon
            const { data: service, error: serviceError } = await supabaseAdmin
                .from('services')
                .select('id, salon_id, duree_minutes')
                .eq('id', bookingData.serviceId)
                .single();

            if (serviceError || !service) return err('Service introuvable', 400);

            if (service.salon_id !== bookingData.salonId) {
                console.warn(`[OTP Verify] Service/salon mismatch`);
                return err('Données de réservation invalides', 400);
            }

            // 2b. Validation : pas dans le passé
            const rdvDateTime = new Date(`${bookingData.date}T${bookingData.time}:00`);
            if (rdvDateTime < new Date()) {
                return err("La date et l'heure du rendez-vous ne peuvent pas être dans le passé.", 400);
            }

            const heureRdv = `${bookingData.time}:00`;
            const employeId = (bookingData.employeeId && bookingData.employeeId !== 'any')
                ? bookingData.employeeId
                : null;

            // 2c. ✅ Vérification conflits de créneaux
            if (employeId) {
                // Si un employé est choisi → vérifier que cet employé est libre
                const { data: conflict } = await supabaseAdmin
                    .from('rendez_vous')
                    .select('id')
                    .eq('date_rdv', bookingData.date)
                    .eq('heure_rdv', heureRdv)
                    .eq('employe_id', employeId)
                    .in('statut', ['confirmed', 'reminded', 'pending'])
                    .limit(1)
                    .single();

                if (conflict) {
                    return err('Ce créneau est déjà réservé pour ce coiffeur. Veuillez choisir une autre heure.', 409);
                }
            }

            // 3. Trouver ou créer le client
            let clientId: string;
            const { data: existingClient } = await supabaseAdmin
                .from('clients')
                .select('id')
                .eq('telephone', phone)
                .single();

            if (existingClient) {
                clientId = existingClient.id;
            } else {
                const { data: newClient, error: clientError } = await supabaseAdmin
                    .from('clients')
                    .insert({ telephone: phone, nom_client: 'Client Web' })
                    .select('id')
                    .single();

                if (clientError || !newClient) throw new Error(`Erreur création client: ${clientError?.message}`);
                clientId = newClient.id;
                console.log(`[OTP Verify] New client created: ${clientId}`);
            }

            // 4. Créer le rendez-vous
            const { error: rdvError } = await supabaseAdmin
                .from('rendez_vous')
                .insert({
                    salon_id: bookingData.salonId,
                    client_id: clientId,
                    service_id: bookingData.serviceId,
                    employe_id: employeId,
                    date_rdv: bookingData.date,
                    heure_rdv: heureRdv,
                    statut: 'confirmed',
                    confirmed_at: new Date().toISOString(),
                });

            if (rdvError) throw new Error(`Erreur création RDV: ${rdvError.message}`);

            console.log(`[OTP Verify] Appointment created for client ${clientId}`);
        } else {
            console.warn('[OTP Verify] No bookingData, OTP verified only.');
        }

        // 5. Marquer l'OTP comme vérifié
        await supabaseAdmin
            .from('otp_custom')
            .update({ verified: true })
            .eq('id', otpRecord.id);

        return ok({ message: 'Validé et RDV créé' });

    } catch (error: any) {
        console.error('[OTP Verify] Error:', error);
        return err(error.message);
    }
}
