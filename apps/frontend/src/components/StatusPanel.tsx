export function StatusPanel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card px-6 py-10 text-center">
      <div className="text-base font-medium text-fg-muted">{children}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
