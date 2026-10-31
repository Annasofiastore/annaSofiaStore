// Una sesión iniciada no basta para usar el panel: cualquier clienta registrada la tiene.
// Solo cuentas con el rol "admin" (app_metadata, que el usuario no puede editar) pueden usar /api/admin.
type UserLike = { app_metadata?: Record<string, unknown> | null } | null | undefined;

// Al ser un "type guard", tras `if (!isAdminUser(user)) return …` TypeScript sabe que `user` existe.
export function isAdminUser<T extends UserLike>(user: T): user is NonNullable<T> {
  return !!user && user.app_metadata?.role === "admin";
}
