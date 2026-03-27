export const ROLES = {
  USER: "user",
  PROVIDER: "provider",
  ADMIN: "admin",
};

export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

