import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NotificationService } from '@/services/notificationService';
import { ok, err } from '@/lib/api-response';

export async function POST(req: Request) {
    try {
        const { phone, bookingData } = await req.json();

        if (!phone || !bookingData) return err('Données manquantes', 400);

        // 1. Validation : le service appartient bien au salon
        const { data: service, error: serviceError } = await supabaseAdmin
            .from('services')
            .select('id, salon_id, duree_minutes')
            .eq('id', bookingData.serviceId)
            .single();

        if (serviceError || !service) return err('Service introuvable', 400);

        if (service.salon_id !== bookingData.salonId) {
            return err('Données de réservation invalides', 400);
        }

        // 2. Validation : pas dans le passé
        const rdvDateTime = new Date(`${bookingData.date}T${bookingData.time}:00`);
        if (rdvDateTime < new Date()) {
            return err("La date et l'heure du rendez-vous ne peuvent pas être dans le passé.", 400);
        }

        const heureRdv = `${bookingData.time}:00`;
        const employeId = (bookingData.employeeId && bookingData.employeeId !== 'any')
            ? bookingData.employeeId
            : null;

        // 3. Vérification conflits de créneaux
        if (employeId) {
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

        // 4. Trouver ou créer le client
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
        }

        // 5. Créer le rendez-vous
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

        // Envoyer une notification de confirmation (Push en priorité, SMS en fallback)
        try {
            const { data: salonData } = await supabaseAdmin
                .from('salons')
                .select('nom_salon')
                .eq('id', bookingData.salonId)
                .single();
            if (salonData) {
                await NotificationService.sendAppointmentConfirmation(
                    phone,
                    salonData.nom_salon,
                    bookingData.date,
                    bookingData.time
                );
            }
        } catch (notifErr) {
            // Non bloquant
            console.warn('[CreateBooking] Notification failed:', notifErr);
        }

        return ok({ message: 'RDV créé avec succès' });

    } catch (error: any) {
        console.error('[Create Booking] Error:', error);
        return err(error.message);
    }
}
