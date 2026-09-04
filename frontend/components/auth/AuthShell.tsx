import Link from "next/link"

export function AuthShell({
  children,
  cta,
}: {
  children: React.ReactNode
  cta?: { label: string; href: string; question: string }
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            L
          </span>
          <span className="font-heading text-base font-semibold text-foreground">
            LuvonGig
          </span>
        </Link>
        {cta && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{cta.question}</span>
            <Link href={cta.href} className="font-medium text-primary hover:underline">
              {cta.label}
            </Link>
          </div>
        )}
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
