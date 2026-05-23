import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NotificationService } from '@/services/notificationService';
import { ok, err } from '@/lib/api-response';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { appointmentIds, reason } = body;

        if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
            return err('IDs de rendez-vous manquants', 400);
        }

        // 1. Récupérer les informations des rendez-vous et des clients
        const { data: appointments, error: fetchError } = await supabaseAdmin
            .from('rendez_vous')
            .select('id, client:clients(telephone, expo_push_token), salon:salons(nom_salon), date_rdv, heure_rdv')
            .in('id', appointmentIds);

        if (fetchError || !appointments) {
            return err('Erreur lors de la récupération des rendez-vous', 500);
        }

        // 2. Mettre à jour le statut des rendez-vous
        const { error: updateError } = await supabaseAdmin
            .from('rendez_vous')
            .update({ statut: 'cancelled_salon', updated_at: new Date().toISOString() })
            .in('id', appointmentIds);

        if (updateError) {
            return err('Erreur lors de l\'annulation des rendez-vous', 500);
        }

        // 3. Envoyer les notifications
        const notificationPromises = appointments.map(async (apt: any) => {
            const clientObj = apt.client;
            const salonObj = apt.salon;
            if (clientObj && !Array.isArray(clientObj) && clientObj.telephone) {
                const salonName = salonObj && !Array.isArray(salonObj) ? salonObj.nom_salon : 'le salon';
                
                // Formatage propre de la date et l'heure
                const dateStr = new Date(apt.date_rdv).toLocaleDateString('fr-FR');
                const heureStr = apt.heure_rdv.substring(0, 5);

                const message = `Reservy : En raison d'un imprévu exceptionnel, votre rendez-vous chez ${salonName} le ${dateStr} à ${heureStr} a dû être annulé. Nous vous prions de nous excuser pour ce désagrément. Vous pouvez reprogrammer un créneau dès maintenant directement sur l'application : reservy://`;
                
                // Envoyer la notification push/SMS hybride
                await NotificationService.sendHybridNotification(clientObj.telephone, message);
            }
        });

        await Promise.all(notificationPromises);

        return ok({ message: 'Rendez-vous annulés avec succès et notifications envoyées.' });
    } catch (error: any) {
        console.error('[Cancel Appointments API] Error:', error);
        return err(error.message || 'Erreur interne du serveur', 500);
    }
}
