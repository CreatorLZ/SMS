// components/ui/role-guard.tsx
"use client";
import { useAuthStore } from "../../store/authStore";
import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RoleGuard({
  allowed,
  children,
}: {
  allowed: string[];
  children: ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading); // Get the loading state
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Do nothing while loading

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
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!user || !allowed.includes(user.role)) return null;

  return <>{children}</>;
}
