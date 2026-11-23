"use client";

import React, { useState } from "react";
import { TopNavigation } from "./TopNavigation";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { ContentContainer } from "./ContentContainer";
import { Role } from "@/types";

export interface AppShellProps {
  children: React.ReactNode;
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
  onLogout?: () => void;
  showSidebar?: boolean;
  contentSize?: "default" | "sm" | "lg" | "full";
  contentPadded?: boolean;
  className?: string;
}

export function AppShell({
  children,
  user,
  onLogout,
  showSidebar = false,
  contentSize = "default",
  contentPadded = true,
  className = "",
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 ${className}`}>
      {/* Sticky Top Navigation */}
      <TopNavigation user={user} onLogout={onLogout} />

      {/* Main Shell Body (Sidebar + Content) */}
      <div className="flex-1 flex w-full">
        {showSidebar && (
          <Sidebar
            userRole={user?.role}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        <main className="flex-1 w-full pb-16 md:pb-0">
          <ContentContainer size={contentSize} padded={contentPadded}>
            {children}
          </ContentContainer>
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileNavigation userRole={user?.role} />
    </div>
  );
}
