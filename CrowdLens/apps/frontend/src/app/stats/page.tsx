"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { isUiPreview, MOCK_PLATFORM_STATS, type PreviewPlatformStats } from "@/lib/ui-preview";

function formatTurnaround(ms: number | null) {
  if (ms == null) {
    return "—";
  }
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

export default function StatsPage() {
  const [stats, setStats] = useState<PreviewPlatformStats | null>(isUiPreview ? MOCK_PLATFORM_STATS : null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isUiPreview);

  useEffect(() => {
    if (isUiPreview) {
      return;
    }
    const base = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!base) {
      setStats(MOCK_PLATFORM_STATS);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await axios.get<PreviewPlatformStats>(`${base}/api/v1/stats`);
        if (!cancelled) {
          setStats(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : "Failed to load stats");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
          Platform stats
        </h1>
        <p className="mt-3 text-slate-400 max-w-2xl">
          Live totals from CrowdLens votes. Individual ballots stay with the creator who can export them as CSV or JSON.
        </p>

        {loading && <p className="mt-10 text-slate-400">Loading stats…</p>}
        {error && <p className="mt-10 text-red-400">{error}</p>}
        {stats && !loading && (
          <>
            <h2 className="mt-12 text-xl font-semibold">Pilot KPIs</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              Progress against grant targets, excluding the seeded demo queue. Unmet targets stay visible.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiMeter
                label="Votes"
                current={stats.pilot.votes}
                target={stats.targets.votes}
                display={`${stats.pilot.votes.toLocaleString()} / ${stats.targets.votes.toLocaleString()}`}
              />
              <KpiMeter
                label="Unique validators"
                current={stats.pilot.uniqueValidators}
                target={stats.targets.uniqueValidators}
                display={`${stats.pilot.uniqueValidators.toLocaleString()} / ${stats.targets.uniqueValidators.toLocaleString()}`}
              />
              <KpiMeter
                label="Unique creators"
                current={stats.pilot.uniqueCreators}
                target={stats.targets.uniqueCreators}
                display={`${stats.pilot.uniqueCreators.toLocaleString()} / ${stats.targets.uniqueCreators.toLocaleString()}`}
              />
              <KpiMeter
                label="Under 5 minutes"
                current={stats.pilot.underFiveMinutesRate ?? 0}
                target={stats.targets.underFiveMinutesRate}
                display={
                  stats.pilot.underFiveMinutesRate == null
                    ? "—"
                    : `${Math.round(stats.pilot.underFiveMinutesRate * 100)}% / 100%`
                }
                ratio={stats.pilot.underFiveMinutesRate}
              />
            </div>
            {stats.pilot.avgTurnaroundMs != null && (
              <p className="mt-3 text-sm text-slate-500">
                Average pilot batch turnaround: {formatTurnaround(stats.pilot.avgTurnaroundMs)}
              </p>
            )}

            <h2 className="mt-12 text-xl font-semibold">All activity</h2>
            <p className="mt-2 text-sm text-slate-400">Includes the demo seed and verify traffic.</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Votes" value={stats.votes.toLocaleString()} />
              <StatCard label="Unique validators" value={stats.uniqueValidators.toLocaleString()} />
              <StatCard label="Tasks done" value={`${stats.tasksDone.toLocaleString()} / ${stats.tasks.toLocaleString()}`} />
              <StatCard label="Avg turnaround" value={formatTurnaround(stats.avgTurnaroundMs)} />
              <StatCard
                label="Under 5 minutes"
                value={
                  stats.underFiveMinutesRate == null
                    ? "—"
                    : `${Math.round(stats.underFiveMinutesRate * 100)}%`
                }
              />
            </div>

            <h2 className="mt-12 text-xl font-semibold">Validator leaderboard</h2>
            {stats.leaderboard.length === 0 ? (
              <p className="mt-4 text-slate-400">No votes yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Rank</th>
                      <th className="text-left px-4 py-3 font-medium">Validator</th>
                      <th className="text-right px-4 py-3 font-medium">Reputation</th>
                      <th className="text-right px-4 py-3 font-medium">Aligned</th>
                      <th className="text-right px-4 py-3 font-medium">Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.leaderboard.map((row) => (
                      <tr key={`${row.rank}-${row.addressPreview}`} className="border-t border-slate-800">
                        <td className="px-4 py-3 text-slate-300">{row.rank}</td>
                        <td className="px-4 py-3 font-mono text-slate-200">{row.addressPreview}</td>
                        <td className="px-4 py-3 text-right text-slate-200">{row.reputation}</td>
                        <td className="px-4 py-3 text-right text-emerald-400">{row.alignedVotes}</td>
                        <td className="px-4 py-3 text-right text-slate-200">{row.votes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function KpiMeter({
  label,
  current,
  target,
  display,
  ratio,
}: {
  label: string;
  current: number;
  target: number;
  display: string;
  ratio?: number | null;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(((ratio ?? (target > 0 ? current / target : 0)) * 100))));
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-5">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{display}</div>
      <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-5">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
