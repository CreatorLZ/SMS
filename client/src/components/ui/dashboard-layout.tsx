"use client";

import * as React from "react";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DashboardSidebar } from "@/components/ui/dashboard-sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { MessageSquare, Bell } from "lucide-react";

function DashboardHeader() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user } = useAuthStore();

  // Get user initials for avatar fallback
  const getUserInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  // Get portal title based on user role
  const getPortalTitle = () => {
    switch (user?.role) {
      case "teacher":
        return "Treasure Land Teacher";
      case "student":
        return "Treasure Land Student";
      case "parent":
        return "Treasure Land Parent";
      case "admin":
      case "superadmin":
      default:
        return "Treasure Land Admin";
    }
  };

  return (
    <TooltipProvider>
      <header className="flex h-16 shrink-0 items-center justify-between px-4 bg-muted/50 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 my-3 mx-4 rounded-xl">
        {/* Left Section - Logo & Title */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger className="-ml-1" />
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            </TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-sidebar-foreground">
              {getPortalTitle()}
            </h1>
          </div>
        </div>

        {/* Right Section - User Controls */}
        {user && (
          <div className="flex items-center gap-4">
            {/* Message Icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="relative flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  {/* Notification badge for future feature */}
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-60"></span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Messages (Coming Soon)
              </TooltipContent>
            </Tooltip>

            {/* Notification Icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="relative flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  {/* Notification badge for future feature */}
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-60"></span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Notifications (Coming Soon)
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            {/* User Avatar & Info */}
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {getUserInitials(user?.name)}
                </AvatarFallback>
              </Avatar>

              <div className="hidden md:block min-w-0">
                <div className="text-sm font-medium text-foreground truncate max-w-[120px]">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-muted-foreground capitalize truncate max-w-[120px]">
                  {user?.role || "user"}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </TooltipProvider>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-hidden">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4 overflow-y-auto">
            <div className="w-full max-w-none">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
