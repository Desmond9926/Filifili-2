import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();

try {
  const passwordHash = await bcrypt.hash("Mod@1234", 10);
  await prisma.user.update({
    where: { email: "moderator@test.com" },
    data: { passwordHash }
  });
  console.log("moderator password updated");
} finally {
  await prisma.$disconnect();
}
