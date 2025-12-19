"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icons } from "@/components/ui/icons";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  onMobileMenuClick?: () => void;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onClearNotifications?: () => void;
  actions?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  showSearch = true,
  onSearch,
  onMobileMenuClick,
  notifications = [],
  onNotificationClick,
  onClearNotifications,
  actions,
}: HeaderProps) {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
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

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <Icons.check className="h-4 w-4 text-emerald-400" />;
      case "warning":
        return <Icons.alert className="h-4 w-4 text-yellow-400" />;
      case "error":
        return <Icons.alert className="h-4 w-4 text-red-400" />;
      default:
        return <Icons.info className="h-4 w-4 text-indigo-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-zinc-800 bg-[#09090b]/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-[#09090b]/80">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-zinc-400 hover:text-white"
        onClick={onMobileMenuClick}
      >
        <Icons.menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Page title */}
      <div className="flex flex-col">
        {title && (
          <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
        )}
        {subtitle && (
          <p className="text-xs text-zinc-500 truncate">{subtitle}</p>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      {showSearch && (
        <form onSubmit={handleSearch} className="hidden md:block">
          <div className="relative">
            <Icons.search
              className={cn(
                "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
                isSearchFocused ? "text-indigo-400" : "text-zinc-500"
              )}
            />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                "w-64 bg-zinc-900 border-zinc-800 pl-9 text-sm text-white placeholder:text-zinc-500",
                "focus:border-indigo-500 focus:ring-indigo-500/20",
                "transition-all duration-200",
                isSearchFocused && "w-80"
              )}
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden select-none items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-400 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </form>
      )}

      {/* Custom actions */}
      {actions}

      {/* Notifications */}
      <TooltipProvider delayDuration={0}>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-zinc-400 hover:text-white"
                >
                  <Icons.bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-medium text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="py-0">
                Notifications
              </DropdownMenuLabel>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs text-zinc-400 hover:text-white"
                  onClick={onClearNotifications}
                >
                  Clear all
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-2 py-8 text-center">
                <Icons.bell className="mx-auto h-8 w-8 text-zinc-700" />
                <p className="mt-2 text-sm text-zinc-500">No notifications</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer",
                      !notification.read && "bg-zinc-900/50"
                    )}
                    onClick={() => onNotificationClick?.(notification)}
                  >
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p
                        className={cn(
                          "text-sm font-medium leading-none",
                          notification.read ? "text-zinc-400" : "text-white"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-zinc-500 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-zinc-600">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.user_metadata?.avatar_url}
                      alt={user?.user_metadata?.name || "User"}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-xs text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Account</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-white leading-none">
                  {user?.user_metadata?.name || "User"}
                </p>
                <p className="text-xs text-zinc-400 leading-none">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Icons.user className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Icons.settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer text-red-400 focus:text-red-400"
            >
              <Icons.logout className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </header>
  );
}

export type { HeaderProps, Notification };
