import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { isValidRole, ROLES } from "@/lib/roles";

function normalizeName(clerkUser) {
  if (!clerkUser) return "User";
  if (clerkUser.fullName) return clerkUser.fullName;
  const first = clerkUser.firstName || "";
  const last = clerkUser.lastName || "";
  const merged = `${first} ${last}`.trim();
  return merged || clerkUser.username || "User";
}

function normalizeEmail(clerkUser, userId) {
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  return (email || `${userId}@clerk.local`).toLowerCase();
}

function metadataRole(clerkUser) {
  const role = clerkUser?.publicMetadata?.role;
  return isValidRole(role) ? role : null;
}

export async function getSessionUser({ createIfMissing = true } = {}) {
  await connectDB();

  const { userId } = await auth();
  if (!userId) return { userId: null, user: null, clerkUser: null };

  let user = await User.findOne({ clerkId: userId });
  let clerkUser = null;

  if (!user || !user.name || !user.email || !isValidRole(user.role)) {
    clerkUser = await currentUser();
  }

  const resolvedRole = metadataRole(clerkUser) || ROLES.USER;

  if (!user && createIfMissing) {
    user = await User.create({
      clerkId: userId,
      name: normalizeName(clerkUser),
      email: normalizeEmail(clerkUser, userId),
      role: resolvedRole,
    });
  }

  if (user) {
    let shouldSave = false;

    if (!user.name && clerkUser) {
      user.name = normalizeName(clerkUser);
      shouldSave = true;
    }

    if (!user.email && clerkUser) {
      user.email = normalizeEmail(clerkUser, userId);
      shouldSave = true;
    }

    if (clerkUser && metadataRole(clerkUser) && user.role !== metadataRole(clerkUser)) {
      user.role = metadataRole(clerkUser);
      shouldSave = true;
    } else if (!isValidRole(user.role)) {
      user.role = resolvedRole;
      shouldSave = true;
    }

    if (shouldSave) await user.save();
  }

  return { userId, user, clerkUser };
}

export function hasRole(user, allowedRoles = []) {
  return Boolean(user && allowedRoles.includes(user.role));
}
