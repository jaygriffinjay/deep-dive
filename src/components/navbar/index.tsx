import Image from "next/image";
import { siteConfig } from "@/site-config";
import { NavMenu } from "./nav-menu";
import { cn } from "@/lib/utils";
import styles from "./navbar.module.css";

interface NavbarProps {
  className?: string;
}

// Logo config lives in src/site-config.ts — set logo.png, logo.svg, or logo.emoji there
function NavbarLogo() {
  const logoSrc = siteConfig.logo.png ?? siteConfig.logo.svg;

  return (
    <div className={styles.logoWrapper}>
      {logoSrc ? (
        <Image src={logoSrc} alt={siteConfig.name} width={28} height={28} className={styles.logoImg} />
      ) : (
        <span className={styles.logoEmoji} aria-hidden>
          {siteConfig.logo.emoji}
        </span>
      )}
      <span className={styles.siteTitle}>
        {siteConfig.name}
      </span>
    </div>
  );
}

export function Navbar({ className }: NavbarProps) {
  return (
    <header className={cn(styles.header, className)}>
      <div className={styles.inner}>
        <NavbarLogo />
        <NavMenu />
      </div>
    </header>
  );
}
