import Link from "next/link";
import {
  BarChart3,
  CircleDollarSign,
  FileUp,
  FolderTree,
  Landmark,
  LayoutDashboard,
  ReceiptText,
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
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-[#091426] px-4 py-6 lg:block">
        <div className="px-2 pb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-elevated text-accent">
            <FolderTree className="h-5 w-5" aria-hidden="true" />
          </div>
          <strong className="mt-4 block text-[22px] leading-none">Finance</strong>
          <span className="mt-2 block text-sm text-muted">
            Analise financeira pessoal
          </span>
        </div>
        <ShellNav title="Analises" links={analysisLinks} />
        <ShellNav title="Operacao" links={operationLinks} />
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-border bg-[#091426] px-4 py-4 lg:hidden">
          <div>
            <strong className="block leading-none">Finance</strong>
            <span className="text-xs text-muted">Analise financeira pessoal</span>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/categories">Categorias</Link>
          </Button>
        </header>
        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-7 lg:py-7">
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
    <nav className="mt-5" aria-label={title}>
      <p className="mb-2 px-2 text-xs font-bold uppercase text-subtle">
        {title}
      </p>
      <div className="grid gap-1">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted transition hover:bg-surface-elevated hover:text-foreground"
              href={link.href}
              key={`${title}-${link.label}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
