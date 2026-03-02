import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export class NotificationService {
    static async sendSMS(to: string, message: string): Promise<boolean> {
        if (!client || !fromPhone) {
            console.log(`[SMS Simulation] To: ${to}, Message: ${message}`);
            return true;
        }
        try {
            await client.messages.create({ body: message, from: fromPhone, to });
            return true;
        } catch (error) {
            console.error('[SMS Error]', error);
            return false;
        }
    }

    static async sendAppointmentReminder(to: string, salonName: string, date: string, time: string): Promise<boolean> {
        const message = `Reservy: Rappel — votre RDV chez ${salonName} est prévu le ${date} à ${time}. À bientôt !`;
        return this.sendSMS(to, message);
    }

    static async sendAppointmentConfirmation(to: string, salonName: string, date: string, time: string): Promise<boolean> {
        const message = `Reservy: Votre RDV chez ${salonName} le ${date} à ${time} est confirmé ✅`;
        return this.sendSMS(to, message);
    }
}
