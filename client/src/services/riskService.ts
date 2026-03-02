import { supabaseAdmin } from '@/lib/supabase-admin';
import { differenceInHours } from 'date-fns';

/**
 * Service pour gérer le calcul du score de risque des clients.
 * Score entre 0.0 (parfait) et 1.0 (très risqué).
 */
export class RiskService {
    /**
     * Recalcule le score de risque d'un client en fonction de son historique récent (90 jours).
     */
    static async recalculateRiskScore(clientId: string): Promise<number> {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const { data: appointments, error } = await supabaseAdmin
            .from('rendez_vous')
            .select('statut, confirmed_at, updated_at, date_rdv, heure_rdv')
            .eq('client_id', clientId)
            .gte('date_rdv', ninetyDaysAgo.toISOString())
            .order('date_rdv', { ascending: false });

        if (error || !appointments || appointments.length === 0) return 0;

        const total = appointments.length;
        const noShows = appointments.filter((a) => a.statut === 'no_show').length;

        const lateCancels = appointments.filter((a) => {
            if (a.statut !== 'cancelled_client') return false;
            if (!a.confirmed_at) return false;

            // ✅ Fix : heure_rdv est stocké comme "HH:MM:SS" (string)
            const dateStr = typeof a.date_rdv === 'string'
                ? a.date_rdv.split('T')[0]
                : new Date(a.date_rdv).toISOString().split('T')[0];
            const timeStr = typeof a.heure_rdv === 'string'
                ? a.heure_rdv.slice(0, 5)
                : '00:00';

            const appointmentDateTime = new Date(`${dateStr}T${timeStr}:00`);
            const cancelTime = new Date(a.updated_at);

            return differenceInHours(appointmentDateTime, cancelTime) < 24;
        }).length;

        // Formule : (absences * 0.5 + annulations tardives * 0.25) / total, saturé à 1.0
        const score = Math.min((noShows * 0.5 + lateCancels * 0.25) / total, 1.0);

        await supabaseAdmin
            .from('clients')
            .update({ risk_score: score })
            .eq('id', clientId);

        return score;
    }

    /**
     * Applique une pénalité immédiate pour un no-show.
     */
    static async recordNoShow(appointmentId: string) {
        const { data: appointment, error } = await supabaseAdmin
            .from('rendez_vous')
            .update({ statut: 'no_show' })
            .eq('id', appointmentId)
            .select('client_id')
            .single();

        if (error) {
            console.error('[RiskService] Failed to update no-show:', error);
            return;
        }

        if (appointment?.client_id) {
            await this.recalculateRiskScore(appointment.client_id);
        }
    }
}
