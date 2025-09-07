import { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      logout();
      router.push("/admin/login");
    }
  };

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "User Management" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-800">
                Treasure Land Admin Portal
              </h1>

              {/* Navigation */}
              {user && (
                <nav className="hidden md:flex space-x-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              )}
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <span className="text-sm text-gray-600 hidden sm:block">
                    Welcome, {user.name} ({user.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          {user && (
            <nav className="md:hidden mt-4 pt-4 border-t">
              <div className="flex space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-6">{children}</main>
    </div>
  );
}
