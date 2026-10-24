import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

const navLinkClass =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
const navLinkActiveClass = "text-sm font-semibold text-primary";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            StudyMatch
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link to="/" activeProps={{ className: navLinkActiveClass }} activeOptions={{ exact: true }}>
            <span className={navLinkClass}>Browse Groups</span>
          </Link>
          <Link to="/create" activeProps={{ className: navLinkActiveClass }}>
            <span className={navLinkClass}>Create Group</span>
          </Link>
          <Link to="/planner" activeProps={{ className: navLinkActiveClass }}>
            <span className={navLinkClass}>AI Planner</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
