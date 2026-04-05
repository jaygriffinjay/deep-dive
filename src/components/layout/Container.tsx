import { cn } from "@/lib/utils";
import styles from "./Container.module.css";

interface ContainerProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Centered max-width content container.
 * Defaults to 640px with standard page margins.
 * Override via className — e.g. pass a Tailwind max-w class or custom style.
 */
export function Container({ className, children }: ContainerProps) {
  return (
    <div className={cn(styles.container, className)}>
      {children}
    </div>
  );
}
