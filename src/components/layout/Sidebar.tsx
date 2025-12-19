"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/ui/icons";
import { useAuth } from "@/hooks/useAuth";

interface Workspace {
  id: string;
  name: string;
  sheets?: Sheet[];
}

interface Sheet {
  id: string;
  name: string;
}

interface SidebarProps {
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  activeSheetId?: string;
  onWorkspaceSelect?: (workspaceId: string) => void;
  onSheetSelect?: (sheetId: string) => void;
  onCreateWorkspace?: () => void;
  onCreateSheet?: (workspaceId: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const navItems = [
  { href: "/", label: "Home", icon: "home" as const },
  { href: "/templates", label: "Templates", icon: "template" as const },
  { href: "/insights", label: "Insights", icon: "insight" as const },
  { href: "/settings", label: "Settings", icon: "settings" as const },
];

function SidebarContent({
  workspaces = [],
  activeWorkspaceId,
  activeSheetId,
  onWorkspaceSelect,
  onSheetSelect,
  onCreateWorkspace,
  onCreateSheet,
  collapsed = false,
  onCollapsedChange,
  isMobile = false,
}: SidebarProps & { isMobile?: boolean }) {
  const pathname = usePathname();
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

  return (
    <div className="flex h-full flex-col bg-[#09090b]">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Icons.table className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-white">SheetAI</span>
          )}
        </Link>
        {!isMobile && onCollapsedChange && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white"
            onClick={() => onCollapsedChange(!collapsed)}
          >
            {collapsed ? (
              <Icons.sidebarOpen className="h-4 w-4" />
            ) : (
              <Icons.sidebarClose className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-2">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => {
            const Icon = Icons[item.icon];
            const isActive = pathname === item.href;

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-indigo-400")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed && !isMobile) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </TooltipProvider>
      </nav>

      <Separator className="my-2" />

      {/* Workspaces */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2">
          {!collapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Workspaces
            </span>
          )}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-zinc-400 hover:text-white"
                  onClick={onCreateWorkspace}
                >
                  <Icons.plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={collapsed ? "right" : "top"}>
                <p>New Workspace</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <ScrollArea className="flex-1 px-2">
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
                      {!collapsed && (
                        <span className="truncate">{workspace.name}</span>
                      )}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateSheet?.(workspace.id);
                      }}
                    >
                      <Icons.plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Sheets list */}
                  {isExpanded && !collapsed && workspace.sheets && (
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

            {workspaces.length === 0 && !collapsed && (
              <div className="px-3 py-8 text-center">
                <Icons.folder className="mx-auto h-8 w-8 text-zinc-700" />
                <p className="mt-2 text-sm text-zinc-500">No workspaces yet</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-indigo-400 hover:text-indigo-300"
                  onClick={onCreateWorkspace}
                >
                  <Icons.plus className="mr-1 h-3 w-3" />
                  Create Workspace
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* User Profile */}
      <div className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-zinc-800",
                collapsed && "justify-center"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-xs text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.user_metadata?.name || "User"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                </div>
              )}
              {!collapsed && (
                <Icons.chevronDown className="h-4 w-4 text-zinc-500" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={collapsed ? "right" : "top"}
            align={collapsed ? "start" : "center"}
            className="w-56"
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Icons.settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-red-400 focus:text-red-400"
            >
              <Icons.logout className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <>
      {/* Mobile hamburger button - rendered separately in Header */}

      {/* Mobile Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent {...props} isMobile collapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden h-screen flex-shrink-0 border-r border-zinc-800 transition-all duration-300 lg:block",
          props.collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent {...props} />
      </aside>
    </>
  );
}

// Export mobile trigger for Header to use
export function MobileSidebarTrigger({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden text-zinc-400 hover:text-white"
      onClick={() => onOpenChange(true)}
    >
      <Icons.menu className="h-5 w-5" />
      <span className="sr-only">Toggle menu</span>
    </Button>
  );
}

export type { SidebarProps, Workspace, Sheet };
