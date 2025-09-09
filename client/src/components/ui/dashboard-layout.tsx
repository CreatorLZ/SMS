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

function DashboardHeader() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <TooltipProvider>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
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
              Treasure Land Admin
            </h1>
          </div>
        </div>
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
