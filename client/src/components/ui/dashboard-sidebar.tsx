"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useRoleCheck } from "./role-guard";
import api from "@/lib/api";
import { useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Building2,
  Calendar,
  Settings,
  LogOut,
  Brain,
  FileText,
  BarChart3,
  DollarSign,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Toast } from "./Toast";
import { useState } from "react";

type ColorType = "emerald" | "blue" | "purple" | "cyan" | "orange" | "teal";

type NavItem = {
  href: string;
  label: string;
  icon: any;
  color: ColorType;
  tooltip: string;
  roles: string[]; // Roles that can access this item
};

// Memoized color classes function to prevent recreation on every render
const getColorClasses = (color: ColorType, isActive: boolean) => {
  const colorMap: Record<ColorType, { active: string; inactive: string }> = {
    emerald: {
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      inactive: "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700",
    },
    blue: {
      active: "bg-blue-50 text-blue-700 border-blue-200",
      inactive: "text-gray-600 hover:bg-blue-50 hover:text-blue-700",
    },
    purple: {
      active: "bg-purple-50 text-purple-700 border-purple-200",
      inactive: "text-gray-600 hover:bg-purple-50 hover:text-purple-700",
    },
    cyan: {
      active: "bg-cyan-50 text-cyan-700 border-cyan-200",
      inactive: "text-gray-600 hover:bg-cyan-50 hover:text-cyan-700",
    },
    orange: {
      active: "bg-orange-50 text-orange-700 border-orange-200",
      inactive: "text-gray-600 hover:bg-orange-50 hover:text-orange-700",
    },
    teal: {
      active: "bg-teal-50 text-teal-700 border-teal-200",
      inactive: "text-gray-600 hover:bg-teal-50 hover:text-teal-700",
    },
  };

  return isActive ? colorMap[color].active : colorMap[color].inactive;
};

// Define navigation items with role restrictions
const getNavItems = (userRole?: string): NavItem[] => {
  const adminItems: NavItem[] = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "emerald",
      tooltip: "Dashboard",
      roles: ["admin", "superadmin"],
    },
    {
      href: "/admin/users",
      label: "User Management",
      icon: Users,
      color: "blue",
      tooltip: "User Management",
      roles: ["admin", "superadmin"],
    },
    {
      href: "/admin/students",
      label: "Student Management",
      icon: GraduationCap,
      color: "purple",
      tooltip: "Student Management",
      roles: ["admin", "superadmin"],
    },
    {
      href: "/admin/teachers",
      label: "Teacher Management",
      icon: UserCheck,
      color: "cyan",
      tooltip: "Teacher Management",
      roles: ["admin", "superadmin"],
    },
    {
      href: "/admin/classrooms",
      label: "Classroom Management",
      icon: Building2,
      color: "orange",
      tooltip: "Classroom Management",
      roles: ["admin", "superadmin"],
    },
    {
      href: "/admin/terms",
      label: "Term Management",
      icon: Calendar,
      color: "teal",
      tooltip: "Term Management",
      roles: ["admin", "superadmin"],
    },
    {
      href: "/admin/fees",
      label: "Fee Management",
      icon: DollarSign,
      color: "emerald",
      tooltip: "Fee Management",
      roles: ["admin", "superadmin"],
    },
  ];

  const teacherItems: NavItem[] = [
    {
      href: "/teacher",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "emerald",
      tooltip: "Teacher Dashboard",
      roles: ["teacher"],
    },
    {
      href: "/teacher/schedule",
      label: "Schedule",
      icon: Calendar,
      color: "teal",
      tooltip: "My Schedule",
      roles: ["teacher"],
    },
    {
      href: "/teacher/attendance",
      label: "Attendance",
      icon: UserCheck,
      color: "blue",
      tooltip: "Mark Attendance",
      roles: ["teacher"],
    },
    {
      href: "/teacher/students",
      label: "My Students",
      icon: Users,
      color: "purple",
      tooltip: "View Students",
      roles: ["teacher"],
    },
    {
      href: "/teacher/grades",
      label: "Grades",
      icon: GraduationCap,
      color: "cyan",
      tooltip: "Enter Grades",
      roles: ["teacher"],
    },
    {
      href: "/teacher/reports",
      label: "Reports",
      icon: BarChart3,
      color: "orange",
      tooltip: "View Reports",
      roles: ["teacher"],
    },
  ];

  const studentItems: NavItem[] = [
    {
      href: "/student",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "emerald",
      tooltip: "Student Dashboard",
      roles: ["student"],
    },
    {
      href: "/student/grades",
      label: "My Grades",
      icon: GraduationCap,
      color: "blue",
      tooltip: "View Grades",
      roles: ["student"],
    },
    {
      href: "/student/attendance",
      label: "Attendance",
      icon: UserCheck,
      color: "purple",
      tooltip: "My Attendance",
      roles: ["student"],
    },
    {
      href: "/student/schedule",
      label: "Schedule",
      icon: Calendar,
      color: "cyan",
      tooltip: "Class Schedule",
      roles: ["student"],
    },
  ];

  const parentItems: NavItem[] = [
    {
      href: "/parent",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "emerald",
      tooltip: "Parent Dashboard",
      roles: ["parent"],
    },
    {
      href: "/parent/children",
      label: "My Children",
      icon: Users,
      color: "blue",
      tooltip: "View Children",
      roles: ["parent"],
    },
    {
      href: "/parent/progress",
      label: "Progress Reports",
      icon: BarChart3,
      color: "purple",
      tooltip: "Academic Progress",
      roles: ["parent"],
    },
    {
      href: "/parent/attendance",
      label: "Attendance",
      icon: UserCheck,
      color: "cyan",
      tooltip: "Children's Attendance",
      roles: ["parent"],
    },
  ];

  // Filter items based on user role
  if (!userRole) return [];

  switch (userRole) {
    case "superadmin":
    case "admin":
      return adminItems.filter((item) => item.roles.includes(userRole));
    case "teacher":
      return teacherItems;
    case "student":
      return studentItems;
    case "parent":
      return parentItems;
    default:
      return [];
  }
};

const secondaryItems: Array<{
  href: string;
  label: string;
  icon: any;
  tooltip: string;
  disabled?: boolean;
  handleClick?: () => void;
}> = [
  {
    href: "#",
    label: "Settings",
    icon: Settings,
    tooltip: "Settings",
    disabled: true,
  },
  {
    href: "#",
    label: "Log Out",
    icon: LogOut,
    tooltip: "Log Out",
    handleClick: () => {}, // Will be set in component
  },
];

export function DashboardSidebar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastProps, setToastProps] = useState<{
    message: string;
    type: "success" | "error";
  }>({ message: "", type: "success" });

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastProps({ message, type });
    setShowToast(true);
  };

  const handleLogout = React.useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await api.post("/auth/logout");
      logout();

      // Redirect to appropriate login page based on user role
      const loginPath =
        user?.role === "teacher"
          ? "/teacher/login"
          : user?.role === "student"
          ? "/student/login"
          : user?.role === "parent"
          ? "/parent/login"
          : "/admin/login";

      router.push(loginPath);
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      showToastMessage("Logout failed, please try again", "error");
    }
  }, [isLoggingOut, user?.role, logout, router]);

  // Memoize navigation items to prevent infinite re-renders
  const navItems = useMemo(() => getNavItems(user?.role), [user?.role]);

  // Update secondary items with logout handler - memoized to prevent infinite re-renders
  const updatedSecondaryItems = React.useMemo(
    () =>
      secondaryItems.map((item) => ({
        ...item,
        handleClick: item.label === "Log Out" ? handleLogout : item.handleClick,
      })),
    [handleLogout]
  );

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-sidebar-primary-foreground group-data-[collapsible=icon]:size-6">
              <Brain className="size-4 group-data-[collapsible=icon]:size-3" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-sidebar-foreground">
                Treasure Land
              </span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {user?.role === "teacher"
                  ? "Teacher Portal"
                  : user?.role === "student"
                  ? "Student Portal"
                  : user?.role === "parent"
                  ? "Parent Portal"
                  : "Admin Portal"}
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="overflow-x-hidden">
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.tooltip}
                        className={getColorClasses(item.color, isActive)}
                      >
                        <Link href={item.href} className="truncate">
                          <Icon className="size-4 flex-shrink-0" />
                          <span className="group-data-[collapsible=icon]:hidden truncate">
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Other</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {updatedSecondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isDisabled =
                    item.disabled || (item.label === "Log Out" && isLoggingOut);

                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild={!item.handleClick}
                        isActive={false}
                        tooltip={item.tooltip}
                        disabled={isDisabled}
                        onClick={item.handleClick}
                        className={
                          isDisabled ? "opacity-50 cursor-not-allowed" : ""
                        }
                      >
                        {item.handleClick ? (
                          <>
                            <Icon className="size-4 flex-shrink-0" />
                            <span className="group-data-[collapsible=icon]:hidden truncate">
                              {item.label}
                            </span>
                          </>
                        ) : (
                          <Link href={item.href} className="truncate">
                            <Icon className="size-4 flex-shrink-0" />
                            <span className="group-data-[collapsible=icon]:hidden truncate">
                              {item.label}
                            </span>
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          {user && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 text-white">
                      {user?.name && user.name.length
                        ? user.name.charAt(0).toUpperCase()
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-sidebar-foreground">
                      {user.name}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/70 capitalize">
                      {user.role}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {showToast && toastProps && (
        <Toast
          message={toastProps.message}
          type={toastProps.type}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
