import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Award,
  Bot,
  Coins,
  Flame,
  FolderGit2,
  Gamepad2,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map,
  Medal,
  Menu,
  Moon,
  Settings,
  Shield,
  ShoppingBag,
  Sun,
  Swords,
  Trophy,
  User as UserIcon,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "../Logo";
import { Avatar } from "../ui";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { cn, fmtNumber } from "../../lib/utils";
import { LANGS, type TKey } from "../../i18n";

interface NavItem {
  to: string;
  key: TKey;
  icon: LucideIcon;
  auth?: boolean;
}

const MAIN: NavItem[] = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard, auth: true },
  { to: "/map", key: "nav.map", icon: Map },
  { to: "/practice", key: "nav.practice", icon: Wrench, auth: true },
  { to: "/game", key: "nav.game", icon: Gamepad2, auth: true },
  { to: "/battle", key: "nav.battle", icon: Swords, auth: true },
  { to: "/projects", key: "nav.projects", icon: FolderGit2, auth: true },
  { to: "/mentor", key: "nav.mentor", icon: Bot, auth: true },
];
const SOCIAL: NavItem[] = [
  { to: "/leaderboard", key: "nav.leaderboard", icon: Trophy },
  { to: "/achievements", key: "nav.achievements", icon: Medal },
  { to: "/shop", key: "nav.shop", icon: ShoppingBag, auth: true },
  {
    to: "/certificates",
    key: "nav.certificates",
    icon: GraduationCap,
    auth: true,
  },
];
const MOBILE: NavItem[] = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { to: "/map", key: "nav.map", icon: Map },
  { to: "/game", key: "nav.game", icon: Gamepad2 },
  { to: "/leaderboard", key: "nav.leaderboard", icon: Trophy },
];

function SideLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const { t } = useSettings();
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold no-underline transition",
          isActive
            ? "bg-primary/15 text-primary"
            : "text-muted hover:bg-card-2 hover:text-fg",
        )
      }
    >
      <item.icon size={19} aria-hidden="true" />
      {t(item.key)}
    </NavLink>
  );
}

function NavGroups({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const { t } = useSettings();
  const visible = (i: NavItem) => !i.auth || !!user;
  return (
    <nav aria-label={t("nav.menu")} className="flex flex-col gap-1">
      {MAIN.filter(visible).map((i) => (
        <SideLink key={i.to} item={i} onClick={onNavigate} />
      ))}
      <div className="my-2 border-t border-border" />
      {SOCIAL.filter(visible).map((i) => (
        <SideLink key={i.to} item={i} onClick={onNavigate} />
      ))}
      {user?.role === "admin" && (
        <>
          <div className="my-2 border-t border-border" />
          <SideLink
            item={{ to: "/admin", key: "nav.admin", icon: Shield }}
            onClick={onNavigate}
          />
        </>
      )}
    </nav>
  );
}

export function ThemeLangControls({ compact }: { compact?: boolean }) {
  const { lang, setLang, isDark, setTheme, t } = useSettings();
  const { user } = useAuth();
  return (
    <div className="flex items-center gap-1">
      <label className="sr-only" htmlFor="lang-select">
        {t("settings.language")}
      </label>
      <select
        id="lang-select"
        className="h-9 rounded-xl border border-border bg-card-2 px-2 text-sm font-semibold"
        value={lang}
        onChange={(e) => setLang(e.target.value as typeof lang)}
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {compact
              ? l.code.toUpperCase()
              : `${l.flag} ${l.code.toUpperCase()}`}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-card-2 hover:text-fg"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={t("settings.theme")}
        title={user ? undefined : t("settings.theme")}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}

function StatsBar() {
  const { user } = useAuth();
  const { t, lang } = useSettings();
  if (!user) return null;
  const item = (
    icon: ReactNode,
    value: ReactNode,
    label: string,
    cls: string,
  ) => (
    <span
      className={cn(
        "flex items-center gap-1 rounded-xl px-2 py-1 text-sm font-bold",
        cls,
      )}
      title={label}
      aria-label={`${label}: ${value}`}
    >
      {icon}
      <span>{value}</span>
    </span>
  );
  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {item(
        <Flame
          size={17}
          className={
            user.streak.todayDone
              ? "fill-orange-500 text-orange-500"
              : "text-muted"
          }
        />,
        user.streak.current,
        t("common.streak"),
        "text-orange-400",
      )}
      {item(
        <Heart size={17} className="fill-rose-500 text-rose-500" />,
        user.hearts,
        t("common.hearts"),
        "text-rose-400",
      )}
      {item(
        <Coins size={17} className="text-amber-400" />,
        fmtNumber(user.coins, lang),
        t("common.coins"),
        "text-amber-400",
      )}
      {item(
        <span className="text-xs">⚡</span>,
        fmtNumber(user.xp, lang),
        t("common.xp"),
        "text-secondary hidden sm:flex",
      )}
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const { t, tx } = useSettings();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  if (!user) {
    return (
      <Link to="/login" className="btn-primary btn-sm">
        <LogIn size={16} /> {t("common.login")}
      </Link>
    );
  }
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-card-2"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar equipped={user.equipped} size={34} />
        <span className="hidden text-left leading-tight lg:block">
          <span className="block max-w-[10rem] truncate text-sm font-bold">
            {user.displayName}
          </span>
          <span className="block text-xs text-muted">
            {t("common.level")} {user.level.level} · {tx(user.level.name)}
          </span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className="card absolute right-0 z-50 mt-2 w-56 p-1.5 shadow-xl"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            {[
              {
                to: `/u/${user.username}`,
                icon: UserIcon,
                label: t("nav.profile"),
              },
              {
                to: "/achievements",
                icon: Award,
                label: t("nav.achievements"),
              },
              { to: "/settings", icon: Settings, label: t("nav.settings") },
            ].map((i) => (
              <Link
                key={i.to}
                role="menuitem"
                to={i.to}
                onClick={() => setOpen(false)}
                className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-fg no-underline hover:bg-card-2"
              >
                <i.icon size={16} /> {i.label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm text-danger hover:bg-card-2"
              onClick={async () => {
                setOpen(false);
                await logout();
                nav("/");
              }}
            >
              <LogOut size={16} /> {t("common.logout")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Asosiy layout: desktopda sidebar, mobilda pastki navigatsiya */
export function AppShell() {
  const { t } = useSettings();
  const { user } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const loc = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  return (
    <div className="space-bg min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-card focus:p-3"
      >
        {t("common.skipToContent")}
      </a>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-bg/80 p-4 backdrop-blur lg:flex">
        <div className="mb-6 px-2">
          <Logo to={user ? "/dashboard" : "/"} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavGroups />
        </div>
      </aside>

      {/* Mobil drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawer(false)}
          >
            <motion.aside
              className="h-full w-72 max-w-[85vw] overflow-y-auto border-r border-border bg-bg p-4"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "tween", duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              aria-label={t("nav.menu")}
            >
              <div className="mb-6 flex items-center justify-between">
                <Logo to={user ? "/dashboard" : "/"} />
                <button
                  type="button"
                  className="btn-ghost btn-sm btn-icon"
                  onClick={() => setDrawer(false)}
                  aria-label={t("common.close")}
                >
                  <X size={20} />
                </button>
              </div>
              <NavGroups onNavigate={() => setDrawer(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-bg/80 px-3 backdrop-blur sm:px-6">
          <button
            type="button"
            className="btn-ghost btn-sm btn-icon lg:hidden"
            onClick={() => setDrawer(true)}
            aria-label={t("nav.menu")}
            aria-expanded={drawer}
          >
            <Menu size={20} />
          </button>
          <div className="hidden sm:block lg:hidden">
            <Logo to={user ? "/dashboard" : "/"} />
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <StatsBar />
            <div className="hidden sm:block">
              <ThemeLangControls />
            </div>
            <UserMenu />
          </div>
        </header>
        <main
          id="main"
          ref={mainRef}
          className="mx-auto w-full max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:pb-10"
        >
          <Outlet />
        </main>
      </div>

      {/* Mobil pastki navigatsiya */}
      {user && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
          aria-label={t("nav.menu")}
        >
          {MOBILE.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) =>
                cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold no-underline",
                  isActive ? "text-primary" : "text-muted",
                )
              }
            >
              <i.icon size={21} aria-hidden="true" />
              <span className="max-w-full truncate px-1">{t(i.key)}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted"
          >
            <Menu size={21} aria-hidden="true" />
            {t("nav.more")}
          </button>
        </nav>
      )}
    </div>
  );
}

export function PublicHeader() {
  const { t } = useSettings();
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
          <ThemeLangControls compact />
          {user ? (
            <Link to="/dashboard" className="btn-primary btn-sm">
              {t("nav.dashboard")}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="btn-ghost btn-sm hidden sm:inline-flex"
              >
                {t("common.login")}
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                {t("common.register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
