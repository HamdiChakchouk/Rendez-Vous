import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export class NotificationService {
    /**
     * Envoie un SMS générique.
     */
    static async sendSMS(to: string, message: string): Promise<boolean> {
        if (!client || !fromPhone) {
            console.log(`[SMS Simulation] To: ${to}, Message: ${message}`);
            return true;
        }

        try {
            await client.messages.create({
                body: message,
                from: fromPhone,
                to: to,
            });
            return true;
        } catch (error) {
            console.error('[SMS Error]', error);
            return false;
        }
    }

    /**
     * Envoie un rappel de rendez-vous.
     */
    static async sendAppointmentReminder(
        to: string,
        salonName: string,
        date: string,
        time: string
    ): Promise<boolean> {
        const message = `Rappel BeautyBook: Votre RDV chez ${salonName} est prévu le ${date} à ${time}. À bientôt !`;
        return this.sendSMS(to, message);
    }

    /**
     * Envoie une confirmation de rendez-vous.
     */
    static async sendAppointmentConfirmation(
        to: string,
        salonName: string,
        date: string,
        time: string
    ): Promise<boolean> {
        const message = `BeautyBook: Votre RDV chez ${salonName} le ${date} à ${time} est bien confirmé.`;
        return this.sendSMS(to, message);
    }
}
