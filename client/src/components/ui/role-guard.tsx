"use client";
import { useAuthStore } from "../../store/authStore";
import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RoleGuard({
  allowed,
  children,
  requireExact = false,
}: {
  allowed: string[];
  children: ReactNode;
  requireExact?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not logged in, redirect to login for this portal
      if (pathname.startsWith("/admin")) router.replace("/admin/login");
      else if (pathname.startsWith("/teacher"))
        router.replace("/teacher/login");
      else if (pathname.startsWith("/student"))
        router.replace("/student/login");
      else if (pathname.startsWith("/parent")) router.replace("/parent/login");
    } else if (!allowed.includes(user.role)) {
      // Logged in but not correct role, redirect to their dashboard
      if (user.role === "admin" || user.role === "superadmin")
        router.replace("/admin");
      else if (user.role === "teacher") router.replace("/teacher");
      else if (user.role === "student") router.replace("/student");
      else if (user.role === "parent") router.replace("/parent");
    }
  }, [user, loading, allowed, router, pathname]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) return null;

  // If requireExact is true, role must match exactly
  if (requireExact && !allowed.includes(user.role)) return null;

  // If requireExact is false, allow if role is in allowed array
  if (!requireExact && !allowed.includes(user.role)) return null;

  return <>{children}</>;
}

// Hook to check if user has specific permissions
export function useRoleCheck() {
  const user = useAuthStore((s) => s.user);

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isSuperAdmin = () => hasRole(["superadmin"]);
  const isAdmin = () => hasRole(["admin", "superadmin"]);
  const isTeacher = () => hasRole(["teacher"]);
  const isStudent = () => hasRole(["student"]);
  const isParent = () => hasRole(["parent"]);

  return {
    hasRole,
    isSuperAdmin,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    user,
  };
}
