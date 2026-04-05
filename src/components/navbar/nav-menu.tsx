"use client";

import { MenuIcon, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { navRoutes } from "./routes";
import styles from "./navbar.module.css";
import NextLink from "next/link";

interface NavMenuProps {
  className?: string;
}

export function NavMenu({ className }: NavMenuProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(styles.menuTrigger, className)}
          aria-label="Open menu"
        >
          <MenuIcon className={styles.menuIcon} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className={styles.dropdownContent}>
        {navRoutes.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <NextLink href={link.href}>{link.label}</NextLink>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* theme toggle: icon shows what you'd switch TO */}
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={styles.themeToggleItem}
        >
          <span>Theme</span>
          {isDark ? <Sun className={styles.themeIcon} /> : <Moon className={styles.themeIcon} />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
