"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, Home, LogOut, User } from "lucide-react";
import { Sidebar } from "./sidebar";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userEmail = session?.user?.email || "";
  const userName = session?.user?.name || userEmail || "User";
  const initials = userName.substring(0, 2).toUpperCase();
  const seed = encodeURIComponent(userEmail || userName || "user");

  const avatarUrl = session?.user?.image ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundType=gradientLinear&backgroundColor=6366f1,8b5cf6,d946ef,ec4899&textColor=ffffff&fontWeight=700&chars=2`;

  const homeHref = (session?.user as any)?.role === "admin" ? "/admin" : "/user";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon" className="shrink-0" />}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Home className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Home</span>
        </div>
      </div>
      
      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
        {mounted && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="border-border transition-all duration-300 ease-out hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-500 hover:scale-105 dark:hover:bg-blue-500/10 dark:hover:border-blue-500/30 dark:hover:text-blue-400 active:scale-95"
          >
            {resolvedTheme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
        <NotificationBell />
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="hidden sm:inline-flex gap-2 border-border transition-all duration-300 ease-out hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400 hover:scale-[1.02] active:scale-95"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="rounded-full transition-transform duration-300 ease-out hover:scale-110 active:scale-95" />}
          >
            <Avatar className="h-9 w-9 border-2 border-border transition-all duration-300 ease-out hover:border-primary/60">
              {avatarUrl && (
                <AvatarImage
                  src={avatarUrl}
                  alt={userName}
                  className="object-cover"
                  suppressHydrationWarning
                />
              )}
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="font-semibold">{userName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{userEmail}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer transition-colors hover:text-primary"
                onClick={() => window.location.assign(homeHref)}
              >
                <Home className="h-4 w-4 mr-2" />
                Home Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive transition-colors"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
