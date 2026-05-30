/**
 * Creates the first admin user in Payload.
 * Run once against the Neon cloud DB:
 *   pnpm tsx --env-file=.env.local scripts/create-admin.ts
 */
import { getPayload } from "payload";
import config from "../src/payload.config";

async function main() {
  const payload = await getPayload({ config });

  // Check if any user already exists
  const existing = await payload.find({ collection: "users", limit: 1 });
  if (existing.totalDocs > 0) {
    console.log("✓ Admin user already exists:", existing.docs[0].email);
    process.exit(0);
  }

  const user = await payload.create({
    collection: "users",
    data: {
      email: "abc@def.com",
      password: "test123",
    },
  });

  console.log("✓ Admin user created:", user.email);
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Failed:", err.message);
  process.exit(1);
});
