import 'dotenv/config';
import prisma from './src/lib/prisma.ts';

async function main() {
    const openingHours = {
        monday: { open: "09:00", close: "19:30" },
        tuesday: { open: "09:00", close: "19:30" },
        wednesday: { open: "09:00", close: "19:30" },
        thursday: { open: "09:00", close: "19:30" },
        friday: { open: "09:00", close: "12:00", pause: "14:30", close_pm: "19:30" },
        saturday: { open: "09:00", close: "20:00" },
        sunday: { open: "closed" }
    };

    const updatedSalon = await prisma.salon.update({
        where: { id: "acfc29ef-c1c9-4e16-a146-d4108f723aa5" },
        data: {
            horaires_ouverture: openingHours
        }
    });

    console.log("Salon hours updated successfully:", JSON.stringify(updatedSalon.horaires_ouverture, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
