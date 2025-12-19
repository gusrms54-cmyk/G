"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar, type Workspace } from "./Sidebar";
import { Header, type Notification } from "./Header";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Icons } from "@/components/ui/icons";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  activeSheetId?: string;
  onWorkspaceSelect?: (workspaceId: string) => void;
  onSheetSelect?: (sheetId: string) => void;
  onCreateWorkspace?: () => void;
  onCreateSheet?: (workspaceId: string) => void;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onClearNotifications?: () => void;
  headerActions?: React.ReactNode;
}

export function AppLayout({
  children,
  pageTitle,
  pageSubtitle,
  showSearch = true,
  onSearch,
  workspaces = [],
  activeWorkspaceId,
  activeSheetId,
  onWorkspaceSelect,
  onSheetSelect,
  onCreateWorkspace,
  onCreateSheet,
  notifications = [],
  onNotificationClick,
  onClearNotifications,
  headerActions,
}: AppLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <Icons.spinner className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b]">
      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <MobileSidebarContent
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            activeSheetId={activeSheetId}
            onWorkspaceSelect={(id) => {
              onWorkspaceSelect?.(id);
              setMobileMenuOpen(false);
            }}
            onSheetSelect={(id) => {
              onSheetSelect?.(id);
              setMobileMenuOpen(false);
            }}
            onCreateWorkspace={() => {
              onCreateWorkspace?.();
              setMobileMenuOpen(false);
            }}
            onCreateSheet={(id) => {
              onCreateSheet?.(id);
              setMobileMenuOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <Sidebar
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        activeSheetId={activeSheetId}
        onWorkspaceSelect={onWorkspaceSelect}
        onSheetSelect={onSheetSelect}
        onCreateWorkspace={onCreateWorkspace}
        onCreateSheet={onCreateSheet}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={pageTitle}
          subtitle={pageSubtitle}
          showSearch={showSearch}
          onSearch={onSearch}
          onMobileMenuClick={() => setMobileMenuOpen(true)}
          notifications={notifications}
          onNotificationClick={onNotificationClick}
          onClearNotifications={onClearNotifications}
          actions={headerActions}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-[#18181b]">
          {children}
        </main>
      </div>
    </div>
  );
}

// Separate mobile sidebar content component to avoid circular dependency
function MobileSidebarContent({
  workspaces,
  activeWorkspaceId,
  activeSheetId,
  onWorkspaceSelect,
  onSheetSelect,
  onCreateWorkspace,
  onCreateSheet,
}: {
  workspaces: Workspace[];
  activeWorkspaceId?: string;
  activeSheetId?: string;
  onWorkspaceSelect?: (id: string) => void;
  onSheetSelect?: (id: string) => void;
  onCreateWorkspace?: () => void;
  onCreateSheet?: (id: string) => void;
}) {
  const { user, signOut } = useAuth();
  const [expandedWorkspaces, setExpandedWorkspaces] = React.useState<Set<string>>(
    new Set(activeWorkspaceId ? [activeWorkspaceId] : [])
  );

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);
      }
      return next;
    });
  };

  const getUserInitials = () => {
    if (!user) return "?";
    const name = user.user_metadata?.name || user.email || "";
    if (name.includes("@")) {
      return name.charAt(0).toUpperCase();
    }
    return name
      .split(" ")
      .map((n: string) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { href: "/", label: "Home", icon: Icons.home },
    { href: "/templates", label: "Templates", icon: Icons.template },
    { href: "/insights", label: "Insights", icon: Icons.insight },
    { href: "/settings", label: "Settings", icon: Icons.settings },
  ];

  return (
    <div className="flex h-full flex-col bg-[#09090b]">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-zinc-800 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Icons.table className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">SheetAI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-2">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="my-2 h-px bg-zinc-800" />

      {/* Workspaces */}
      <div className="flex-1 overflow-auto px-2">
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Workspaces
          </span>
          <button
            onClick={onCreateWorkspace}
            className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
          >
            <Icons.plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1 pb-4">
          {workspaces.map((workspace) => {
            const isExpanded = expandedWorkspaces.has(workspace.id);
            const isActive = activeWorkspaceId === workspace.id;

            return (
              <div key={workspace.id}>
                <div
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors cursor-pointer",
                    isActive
                      ? "bg-zinc-800/70 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                  )}
                >
                  <button
                    onClick={() => toggleWorkspace(workspace.id)}
                    className="flex items-center"
                  >
                    {isExpanded ? (
                      <Icons.chevronDown className="h-4 w-4" />
                    ) : (
                      <Icons.chevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => onWorkspaceSelect?.(workspace.id)}
                    className="flex flex-1 items-center gap-2 truncate"
                  >
                    {isExpanded ? (
                      <Icons.folderOpen className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <Icons.folder className="h-4 w-4" />
                    )}
                    <span className="truncate">{workspace.name}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateSheet?.(workspace.id);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white rounded transition-all"
                  >
                    <Icons.plus className="h-3 w-3" />
                  </button>
                </div>

                {isExpanded && workspace.sheets && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {workspace.sheets.map((sheet) => {
                      const isSheetActive = activeSheetId === sheet.id;
                      return (
                        <button
                          key={sheet.id}
                          onClick={() => onSheetSelect?.(sheet.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors",
                            isSheetActive
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
                          )}
                        >
                          <Icons.sheet className="h-3.5 w-3.5" />
                          <span className="truncate">{sheet.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {workspaces.length === 0 && (
            <div className="px-3 py-8 text-center">
              <Icons.folder className="mx-auto h-8 w-8 text-zinc-700" />
              <p className="mt-2 text-sm text-zinc-500">No workspaces yet</p>
              <button
                onClick={onCreateWorkspace}
                className="mt-2 inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300"
              >
                <Icons.plus className="mr-1 h-3 w-3" />
                Create Workspace
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* User Profile */}
      <div className="p-2">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-medium text-white">
            {getUserInitials()}
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium text-white truncate">
              {user?.user_metadata?.name || "User"}
            </p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 text-zinc-400 hover:text-red-400 rounded transition-colors"
          >
            <Icons.logout className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export type { AppLayoutProps };
