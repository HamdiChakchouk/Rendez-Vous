import { NextResponse } from 'next/server'
import { NotificationService } from '@/services/notificationService'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { phone } = await req.json()
        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Store OTP in database
        await prisma.otpCustom.create({
            data: {
                telephone: phone,
                code_otp: otp,
                date_expiration: expiresAt
            }
        })

        const success = await NotificationService.sendSMS(
            phone,
            `Votre code de validation Rendez-Vous.tn: ${otp}`
        )

        if (success) {
            console.log(`[OTP] Sent ${otp} to ${phone}`)
            return NextResponse.json({ success: true, message: "OTP Envoyé" })
        } else {
            return NextResponse.json({ success: false, error: "Erreur d'envoi SMS" }, { status: 500 })
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
