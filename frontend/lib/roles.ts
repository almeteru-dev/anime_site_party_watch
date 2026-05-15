export type Role = "user" | "moderator" | "admin" | "root"

export function roleLevel(role: string): number {
  switch (role) {
    case "root":
      return 4
    case "admin":
      return 3
    case "moderator":
      return 2
    case "user":
      return 1
    default:
      return 0
  }
}

export function roleLabel(role: string): string {
  switch (role) {
    case "root":
      return "Root"
    case "admin":
      return "Admin"
    case "moderator":
      return "Moderator"
    case "user":
      return "User"
    default:
      return role
  }
}

export function canManageUser(currentRole: string, currentUserId: number | null, targetRole: string, targetUserId: number): boolean {
  if (targetRole === "root") return false
  if (currentUserId !== null && currentUserId === targetUserId) return false
  if (currentRole === "root") return true
  if (currentRole === "admin") return targetRole !== "admin" && roleLevel(targetRole) < roleLevel("admin")
  return false
}

