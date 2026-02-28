import prisma from '@/lib/prisma';
import { differenceInHours } from 'date-fns';

/**
 * Service pour gérer le calcul du score de risque des clients.
 * Score entre 0.0 (parfait) et 1.0 (très risqué).
 */
export class RiskService {
    /**
     * Recalcule le score de risque d'un client en fonction de son historique récent (90 jours).
     * @param clientId ID du client
     */
    static async recalculateRiskScore(clientId: string): Promise<number> {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const appointments = await prisma.rendezVous.findMany({
            where: {
                client_id: clientId,
                date_rdv: {
                    gte: ninetyDaysAgo,
                },
            },
            orderBy: {
                date_rdv: 'desc',
            },
        });

        if (appointments.length === 0) return 0;

        const total = appointments.length;
        const noShows = appointments.filter((a) => a.statut === 'no_show').length;
        const lateCancels = appointments.filter((a) => {
            if (a.statut !== 'cancelled_client') return false;
            if (!a.confirmed_at) return false; // On ne pénalise pas si non confirmé? A débattre.

            // Si annulé moins de 24h avant l'heure prévue
            // Note: date_rdv et heure_rdv sont séparés dans le schéma actuel.
            // On combine pour le calcul.
            const appointmentDate = new Date(a.date_rdv);
            const [hours, minutes] = (a.heure_rdv as any).toString().split(':').map(Number);
            appointmentDate.setHours(hours, minutes);

            const cancelTime = (a as any).updated_at; // On suppose que updated_at est le moment de l'annulation
            return differenceInHours(appointmentDate, cancelTime) < 24;
        }).length;

        // Formule inspirée de Claude : (absences * 0.5 + annulations tardives * 0.25) / total
        const score = (noShows * 0.5 + lateCancels * 0.25) / total;

        // On sature à 1.0
        const finalScore = Math.min(score, 1.0);

        await prisma.client.update({
            where: { id: clientId },
            data: { risk_score: finalScore },
        });

        return finalScore;
    }

    /**
     * Applique une pénalité immédiate pour un no-show.
     */
    static async recordNoShow(appointmentId: string) {
        const appointment = await prisma.rendezVous.update({
            where: { id: appointmentId },
            data: { statut: 'no_show' },
            include: { client: true },
        });

        if (appointment.client_id) {
            await this.recalculateRiskScore(appointment.client_id);
        }
    }
}
