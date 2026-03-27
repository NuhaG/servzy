import { clerkClient } from "@clerk/nextjs/server";
import { isValidRole } from "@/lib/roles";

export async function syncClerkUserRole(clerkId, role) {
  if (!clerkId || !isValidRole(role)) return;

  const client = await clerkClient();
  await client.users.updateUser(clerkId, {
    publicMetadata: { role },
  });
}

