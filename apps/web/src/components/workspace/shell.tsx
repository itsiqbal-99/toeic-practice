"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  BookOpen,
  LayoutDashboard,
  SlidersHorizontal,
  ClipboardCheck,
  ChartNoAxesCombined,
  History,
  UserRound,
  ArrowUpRight,
  PanelLeftClose,
  Menu,
} from "lucide-react";
import type { Profile } from "@toeic/shared";
import { api } from "@/lib/api";
import { Dialog } from "@/components/ui/dialog";
const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/practice", label: "Practice", icon: SlidersHorizontal },
  { href: "/mock-tests", label: "Mock tests", icon: ClipboardCheck },
  { href: "/progress", label: "My progress", icon: ChartNoAxesCombined },
  { href: "/review", label: "Review", icon: History },
  { href: "/account", label: "Account", icon: UserRound },
];
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="TOEIC Practice dashboard">
      <span className="brand-symbol">
        <BookOpen aria-hidden="true" />
      </span>
      <span>
        toeic<span className="brand-sub">practice workspace</span>
      </span>
    </Link>
  );
}
export function WorkspaceShell({
  children,
  title,
  subtitle,
  action,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  const path = usePathname(),
    [open, setOpen] = useState(false),
    [compact, setCompact] = useState(false);
  const { data: user } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api<Profile>("/auth/me"),
  });
  const nav = (
    <nav aria-label="Main navigation" className="side-nav">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={path === href ? "nav-link active" : "nav-link"}
          aria-current={path === href ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
          {path === href ? (
            <motion.span layoutId="nav-dot" className="nav-dot" />
          ) : null}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className={compact ? "app-shell compact" : "app-shell"}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="sidebar-top">
          <Brand />
          <button
            className="icon-button collapse-nav"
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCompact(!compact)}
          >
            <PanelLeftClose />
          </button>
        </div>
        <span className="nav-caption">YOUR WORKSPACE</span>
        {nav}
        <div className="sidebar-bottom">
          <div className="local-note">
            <span className="status-dot" />
            <span>
              {user?.guest ? "Guest workspace" : "Personal workspace"}
            </span>
          </div>
          {user?.guest ? (
            <a
              href={user.googleEnabled ? "/api/v1/auth/google" : "/account"}
              className="sync-note"
            >
              {user.googleEnabled
                ? "Sign in with Google"
                : "Keep your progress across devices"}{" "}
              <ArrowUpRight aria-hidden="true" />
            </a>
          ) : null}
          <Link href="/account" className="profile-link">
            <span className="avatar">
              {user?.guest ? (
                <UserRound aria-hidden="true" />
              ) : (
                user?.name.slice(0, 1) || "·"
              )}
            </span>
            <span className="profile-copy">
              <strong>{user?.name || "Your workspace"}</strong>
              <small>
                {user?.guest ? "Continue as a guest" : "Account & preferences"}
              </small>
            </span>
          </Link>
        </div>
      </aside>
      <header className="mobile-header">
        <Brand />
        <div>
          <Link href="/account" className="icon-button" aria-label="Account">
            <UserRound />
          </Link>
          <button
            className="icon-button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
        </div>
      </header>
      <div className="app-content">
        <div className="context-bar">
          <span>
            Workspace <span className="slash">/</span> {title}
          </span>
          <span className="context-right">
            <span className="status-dot" />
            {user?.guest ? "Guest session" : "Connected workspace"}
          </span>
        </div>
        <main id="main">
          <header className="page-header">
            <div>
              <p className="eyebrow">{subtitle}</p>
              <h1>{title}</h1>
            </div>
            {action || (!["/practice","/mock-tests"].includes(path) ? (
              <Link
                href="/practice"
                className="button button--solid button--brand"
              >
                Start practice <ArrowUpRight aria-hidden="true" />
              </Link>
            ):null)}
          </header>
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            {children}
          </motion.div>
        </main>
        <footer className="workspace-footer">
          <span>TOEIC Practice</span>
          <span>Independent practice. Unofficial results.</span>
        </footer>
      </div>
      <nav className="mobile-bottom" aria-label="Mobile navigation">
        {links
          .filter((l) => l.href !== "/account")
          .map(({ href, label, icon: Icon }) => (
            <Link
              href={href}
              key={href}
              aria-current={path === href ? "page" : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{label === "My progress" ? "Progress" : label}</span>
            </Link>
          ))}
      </nav>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Your workspace"
        description="Navigate your learning workspace."
        variant="drawer"
      >
        {nav}
      </Dialog>
    </div>
  );
}
