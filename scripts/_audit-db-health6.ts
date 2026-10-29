import "dotenv/config";
import { prisma } from "../lib/db";
async function main() {
  console.log(await prisma.siteImageSlot.findMany());
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
