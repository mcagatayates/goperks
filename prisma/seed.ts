import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.conversationMessage.deleteMany();
  await prisma.conversationSession.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurantTable.deleteMany();
  await prisma.whatsAppConnection.deleteMany();
  await prisma.restaurant.deleteMany();

  const restaurant = await prisma.restaurant.create({
    data: {
      slug: "masa19",
      name: "Masa19",
      description:
        "Modern Turkish cuisine with a seasonal, ingredient-driven menu, in the heart of Istanbul. Cozy dining room and a lively outdoor terrace.",
      address: "Bogazkesen Cad. No:19, Beyoglu, Istanbul",
      phone: "+90 212 555 01 19",
      timezone: "Europe/Istanbul",
      openTime: "12:00",
      closeTime: "23:30",
      reservationDurationMinutes: 90,
      tables: {
        create: [
          { name: "T1", capacity: 2 },
          { name: "T2", capacity: 2 },
          { name: "T3", capacity: 4 },
          { name: "T4", capacity: 4 },
          { name: "T5", capacity: 4 },
          { name: "T6", capacity: 6 },
          { name: "T7", capacity: 6 },
          { name: "Terrace-1", capacity: 8 },
        ],
      },
      menuItems: {
        create: [
          {
            name: "Levrek Tartar",
            description: "Sea bass tartare, blood orange, olive oil, dill",
            price: 420,
            category: "starter",
            isSpecial: true,
          },
          {
            name: "Kuzu Incik",
            description: "Slow-braised lamb shank, smoked eggplant puree",
            price: 780,
            category: "main",
            isSpecial: true,
          },
          {
            name: "Mercimek Corbasi",
            description: "Classic red lentil soup",
            price: 180,
            category: "starter",
            isSpecial: false,
          },
          {
            name: "Antep Fistikli Kunefe",
            description: "Kunefe with Antep pistachio and kaymak",
            price: 260,
            category: "dessert",
            isSpecial: true,
          },
        ],
      },
    },
  });

  console.log(`Seeded restaurant: ${restaurant.name} (${restaurant.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
