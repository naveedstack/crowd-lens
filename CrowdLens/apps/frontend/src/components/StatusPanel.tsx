export function StatusPanel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-10 text-center">
      <div className="text-base font-medium text-slate-300">{children}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
