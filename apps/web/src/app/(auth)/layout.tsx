export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-lg font-bold tracking-tight text-fg">
            Zporter <span className="text-accent">Challenges</span>
          </div>
          <p className="mt-1 text-sm text-muted">Creator studio</p>
        </div>
        {children}
      </div>
    </div>
  );
}
