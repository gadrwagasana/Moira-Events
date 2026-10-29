import "dotenv/config";
import { prisma } from "../lib/db";
async function main() {
  console.log(JSON.stringify({ admin: await prisma.admin.count() }));
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
