"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
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

type ColorType = "emerald" | "blue" | "purple" | "cyan" | "orange" | "teal";

const navItems: Array<{
  href: string;
  label: string;
  icon: any;
  color: ColorType;
  tooltip: string;
}> = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "emerald",
    tooltip: "Dashboard",
  },
  {
    href: "/admin/users",
    label: "User Management",
    icon: Users,
    color: "blue",
    tooltip: "User Management",
  },
  {
    href: "/admin/students",
    label: "Student Management",
    icon: GraduationCap,
    color: "purple",
    tooltip: "Student Management",
  },
  {
    href: "/admin/teachers",
    label: "Teacher Management",
    icon: UserCheck,
    color: "cyan",
    tooltip: "Teacher Management",
  },
  {
    href: "/admin/classrooms",
    label: "Classroom Management",
    icon: Building2,
    color: "orange",
    tooltip: "Classroom Management",
  },
  {
    href: "/admin/terms",
    label: "Term Management",
    icon: Calendar,
    color: "teal",
    tooltip: "Term Management",
  },
];

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

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      logout();
      router.push("/admin/login");
      setIsLoggingOut(false);
    }
  };

  // Update secondary items with logout handler
  const updatedSecondaryItems = secondaryItems.map((item) => ({
    ...item,
    handleClick: item.label === "Log Out" ? handleLogout : item.handleClick,
  }));

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
                Admin Portal
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
                      {user.name?.charAt(0).toUpperCase()}
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
    </>
  );
}
