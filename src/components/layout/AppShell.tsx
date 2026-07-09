import Link from "next/link";
import {
  BarChart3,
  CircleDollarSign,
  FileUp,
  FolderTree,
  Landmark,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
  Tags,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-surface/95 lg:flex">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
            <FolderTree className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div>
            <strong className="block text-sm leading-none">Finance</strong>
            <span className="mt-1 block text-[10px] text-muted">
              Analise financeira
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4">
          <ShellNav title="Visao geral" links={analysisLinks} />
          <ShellNav title="Registros" links={operationLinks} />
        </div>
        <div className="border-t border-border px-2 py-3">
          <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-xs font-medium text-muted transition hover:bg-surface-elevated hover:text-foreground">
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            Configuracoes
          </button>
          <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-xs font-medium text-muted transition hover:bg-negative/10 hover:text-negative">
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sair
          </button>
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
            <div className="flex size-6 items-center justify-center rounded-md bg-accent/15 text-accent">
              <FolderTree className="h-3 w-3" aria-hidden="true" />
            </div>
            <strong className="text-sm leading-none">Finance</strong>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/categories">Categorias</Link>
          </Button>
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
  title,
}: {
  readonly links: typeof analysisLinks;
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

          return (
            <Link
              className="flex min-h-9 items-center gap-2.5 rounded-md px-2 text-xs font-medium text-muted transition hover:bg-surface-elevated hover:text-foreground"
              href={link.href}
              key={`${title}-${link.label}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
