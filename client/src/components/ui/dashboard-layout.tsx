import { ReactNode, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Building2,
  Calendar,
  FileText,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
    },
    {
      href: "/admin/users",
      label: "User Management",
      icon: Users,
      description: "Manage system users",
    },
    {
      href: "/admin/students",
      label: "Student Management",
      icon: GraduationCap,
      description: "Student records & data",
    },
    {
      href: "/admin/teachers",
      label: "Teacher Management",
      icon: UserCheck,
      description: "Staff & faculty management",
    },
    {
      href: "/admin/classrooms",
      label: "Classroom Management",
      icon: Building2,
      description: "Class & room assignments",
    },
    {
      href: "/admin/terms",
      label: "Term Management",
      icon: Calendar,
      description: "Academic terms & periods",
    },
  ];

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="flex items-center justify-center p-6 border-b border-emerald-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && !mobile && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-emerald-800">
                Treasure Land
              </span>
              <span className="text-xs text-emerald-600">Admin Portal</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setMobileMenuOpen(false)}
              className={`group flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-emerald-100 text-emerald-800 shadow-sm"
                  : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 ${
                  isActive
                    ? "text-emerald-600"
                    : "text-gray-500 group-hover:text-emerald-600"
                }`}
              />
              {(!sidebarCollapsed || mobile) && (
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {item.label}
                  </div>
                  {!mobile && (
                    <div className="text-xs text-gray-500 truncate">
                      {item.description}
                    </div>
                  )}
                </div>
              )}
              {isActive && (
                <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-emerald-100">
        {user && (
          <div className="flex items-center justify-between mb-3">
            {(!sidebarCollapsed || mobile) && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {user.role}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Collapse Toggle */}
        {!mobile && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-emerald-100 shadow-sm transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 bg-white shadow-xl">
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-emerald-100 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-emerald-800">
            Admin Portal
          </h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
