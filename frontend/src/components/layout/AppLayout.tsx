import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from "../ui/navigation-menu";
import { Separator } from "../ui/separator";

import { useAuth } from "../../lib/auth";
import { cn } from "../../lib/utils";

type AppLayoutProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppLayout({
  title,
  subtitle,
  actions,
  children
}: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const isChecklist = pathname.startsWith("/checklist");
  const isQuestionnaire = pathname === "/questionnaire";
  const isSpvsQuestionnaire = pathname === "/spvs/questionnaire";
  const isSpvsRequirements = pathname === "/spvs/requirements";
  const isDashboard = pathname === "/dashboard";

  const initials = user
    ? user.name
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2)
    : "??";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-lg font-semibold">
              OWASP RAT Modern
            </Link>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={cn(navigationMenuTriggerStyle, {
                      "bg-accent text-accent-foreground": isDashboard
                    })}
                  >
                    <Link to="/dashboard">Dashboard</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={cn(navigationMenuTriggerStyle, {
                      "bg-accent text-accent-foreground": isChecklist
                    })}
                  >
                    <Link to="/checklist">Checklist</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={cn(navigationMenuTriggerStyle, {
                      "bg-accent text-accent-foreground": isQuestionnaire
                    })}
                  >
                    <Link to="/questionnaire">Questionnaire</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={cn(navigationMenuTriggerStyle, {
                      "bg-accent text-accent-foreground": isSpvsQuestionnaire
                    })}
                  >
                    <Link to="/spvs/questionnaire">SPVS Questionnaire</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={cn(navigationMenuTriggerStyle, {
                      "bg-accent text-accent-foreground": isSpvsRequirements
                    })}
                  >
                    <Link to="/spvs/requirements">SPVS Requirements</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left leading-tight">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.role}
                  </span>
                </div>
              </div>
            )}
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="container flex flex-1 flex-col gap-6 py-10">
          {(title || subtitle || actions) && (
            <>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  {title && (
                    <h1 className="text-2xl font-semibold leading-tight">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
                {actions}
              </div>
              <Separator />
            </>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}
