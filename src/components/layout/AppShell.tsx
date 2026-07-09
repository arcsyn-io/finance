"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BarChart3,
  CircleDollarSign,
  FileUp,
  FolderTree,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Tags,
  Wallet,
} from "lucide-react";

const analysisLinks = [
  { href: "/", label: "Visao geral", icon: LayoutDashboard },
  { href: "/", label: "Fluxo de caixa", icon: BarChart3 },
  { href: "/", label: "Liquidez", icon: Wallet },
  { href: "/", label: "Patrimonio", icon: Landmark },
];

const operationLinks = [
  { href: "/", label: "Lancamentos", icon: ReceiptText },
  { href: "/", label: "Carteiras", icon: CircleDollarSign },
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/", label: "Importar CSV", icon: FileUp },
];

export function AppShell({ children }: { readonly children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [logoutPending, startLogoutTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    setLogoutError(null);

    const response = await fetch("/api/auth/sign-out", {
      method: "POST",
    });
    const body = (await response.json()) as {
      readonly redirectTo?: string;
      readonly error?: string;
    };

    if (!response.ok) {
      setLogoutError(body.error ?? "Nao foi possivel sair da conta");
      return;
    }

    setMenuOpen(false);
    router.replace(body.redirectTo ?? "/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
      {menuOpen ? (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-300 lg:sticky lg:z-30 lg:h-screen lg:w-auto lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center gap-2.5 px-4 py-5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
            <FolderTree className="size-3.5" aria-hidden="true" />
          </div>
          <div>
            <strong className="block text-sm leading-none">Finance</strong>
            <span className="mt-1 block text-[10px] text-muted">
              Analise financeira
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4">
          <ShellNav
            links={analysisLinks}
            onNavigate={() => setMenuOpen(false)}
            pathname={pathname}
            title="Visao geral"
          />
          <ShellNav
            links={operationLinks}
            onNavigate={() => setMenuOpen(false)}
            pathname={pathname}
            title="Registros"
          />
        </div>
        <div className="border-t border-border px-2 py-3">
          <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-xs font-medium text-muted transition hover:bg-surface-elevated hover:text-foreground">
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            Configuracoes
          </button>
          <button
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-xs font-medium text-muted transition hover:bg-negative/10 hover:text-negative disabled:opacity-60"
            disabled={logoutPending}
            onClick={() => startLogoutTransition(() => void handleLogout())}
            type="button"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            {logoutPending ? "Saindo..." : "Sair"}
          </button>
          {logoutError ? (
            <p className="px-2 py-1 text-[10px] leading-4 text-negative">
              {logoutError}
            </p>
          ) : null}
          <div className="mt-1 flex items-center gap-2.5 px-2 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
              LC
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">Lucas</p>
              <p className="truncate text-[10px] text-muted">Controlador</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <button
              aria-label="Abrir menu"
              className="mr-1 flex size-8 items-center justify-center rounded-md text-muted transition hover:bg-surface-elevated hover:text-foreground"
              onClick={() => setMenuOpen(true)}
              type="button"
            >
              <Menu className="size-4" aria-hidden="true" />
            </button>
            <div className="flex size-6 items-center justify-center rounded-md bg-accent/15 text-accent">
              <FolderTree className="h-3 w-3" aria-hidden="true" />
            </div>
            <strong className="text-sm leading-none">Finance</strong>
          </div>
          <span className="max-w-[150px] truncate text-xs text-muted">
            {pathname === "/categories" ? "Categorias" : "Painel"}
          </span>
        </header>
        <main className="mx-auto min-w-0 max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}

function ShellNav({
  links,
  onNavigate,
  pathname,
  title,
}: {
  readonly links: typeof analysisLinks;
  readonly onNavigate: () => void;
  readonly pathname: string;
  readonly title: string;
}) {
  return (
    <nav aria-label={title}>
      <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-widest text-subtle">
        {title}
      </p>
      <div className="grid gap-0.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === "/categories"
              ? pathname === "/categories"
              : pathname === "/" && link.label === "Visao geral";

          return (
            <Link
              className={`relative flex min-h-9 items-center gap-2.5 rounded-md px-2 text-xs font-medium transition ${
                isActive
                  ? "bg-surface-elevated text-foreground"
                  : "text-muted hover:bg-surface-elevated hover:text-foreground"
              }`}
              href={link.href}
              key={`${title}-${link.label}`}
              onClick={onNavigate}
            >
              {isActive ? (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
              ) : null}
              <Icon className={`size-3.5 ${isActive ? "text-accent" : ""}`} aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
