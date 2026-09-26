"use client"
import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
    isUiPreview,
    MOCK_CAPTION_TASK_ANALYTICS,
    MOCK_CAPTION_TASK_DETAILS,
    MOCK_CAPTION_TASK_RESULTS,
    MOCK_TASK_ANALYTICS,
    MOCK_TASK_DETAILS,
    MOCK_TASK_RESULTS,
    PREVIEW_CAPTION_TASK_ID,
    type PreviewTaskAnalytics,
    type PreviewTaskResult,
} from '@/lib/ui-preview';
import { api } from '@/lib/api';
import { useAuthSession } from '@/lib/use-auth-session';

export default function Page({params}: {params: Promise<{ taskId: string }>}) {
    const { taskId } = use(params);
    const [result, setResult] = useState<Record<string, PreviewTaskResult>>({});
    const [taskDetails, setTaskDetails] = useState<{
        title?: string | null;
        done?: boolean;
        required_submissions?: number;
        submission_count?: number;
        winner_option_id?: number | null;
        signature?: string | null;
        escrow_pda?: string | null;
        vote_commitment?: string | null;
        settle_status?: string | null;
    }>({});
    const [analytics, setAnalytics] = useState<PreviewTaskAnalytics | null>(null);
    const [exporting, setExporting] = useState<"csv" | "json" | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { token, waitingForAuth, unauthenticated, authTick } = useAuthSession();

    const fetchTaskDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            if (isUiPreview) {
                if (taskId === PREVIEW_CAPTION_TASK_ID) {
                    setTaskDetails(MOCK_CAPTION_TASK_DETAILS);
                    setResult(MOCK_CAPTION_TASK_RESULTS);
                    setAnalytics(MOCK_CAPTION_TASK_ANALYTICS);
                } else {
                    setTaskDetails(MOCK_TASK_DETAILS);
                    setResult(MOCK_TASK_RESULTS);
                    setAnalytics(MOCK_TASK_ANALYTICS);
                }
                return;
            }

            if (waitingForAuth) {
                return;
            }

            if (unauthenticated || !token) {
                setResult({});
                setAnalytics(null);
                setError(null);
                return;
            }

            const response = await api.get(`/task?taskId=${taskId}`);

            if (response.data.result) {
                setResult(response.data.result);
            }
            if (response.data.taskDetails) {
                setTaskDetails(response.data.taskDetails);
            }
            setAnalytics(response.data.analytics ?? null);
        } catch (err) {
            const message = axios.isAxiosError(err)
                ? err.response?.data?.error || err.message
                : err instanceof Error ? err.message : "Failed to load task details";
            setError(message);
        } finally {
            if (waitingForAuth) {
                return;
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaskDetails();
    }, [taskId, token, waitingForAuth, unauthenticated, authTick]);

    async function downloadExport(format: "csv" | "json") {
        try {
            setExporting(format);
            setExportError(null);
            if (isUiPreview) {
                const payload =
                    format === "json"
                        ? JSON.stringify(
                              [
                                  {
                                      task_id: 1,
                                      title: taskDetails.title,
                                      done: taskDetails.done,
                                      winner_option_id: taskDetails.winner_option_id,
                                      option_id: 1,
                                      option_type: "Image",
                                      image_url: "",
                                      content: "",
                                      comment: "Preview vote",
                                      created_at: new Date().toISOString(),
                                      worker_hash: "previewhash000001",
                                  },
                              ],
                              null,
                              2,
                          )
                        : "task_id,title,done,winner_option_id,option_id,option_type,image_url,content,comment,created_at,worker_hash\n1,preview,true,1,1,Image,,,Preview vote,2026-09-22T08:00:00.000Z,previewhash000001";
                saveBlob(
                    new Blob([payload], { type: format === "json" ? "application/json" : "text/csv" }),
                    `crowdlens-task-preview.${format}`,
                );
                return;
            }
            const response = await api.get(`/task/export?taskId=${taskId}&format=${format}`, {
                responseType: "blob",
            });
            const disposition = String(response.headers["content-disposition"] ?? "");
            const matched = disposition.match(/filename="([^"]+)"/);
            saveBlob(response.data, matched?.[1] ?? `crowdlens-task-${taskId}.${format}`);
        } catch (err) {
            const message = axios.isAxiosError(err)
                ? err.response?.data?.error || err.message
                : "Failed to export votes";
            setExportError(typeof message === "string" ? message : "Failed to export votes");
        } finally {
            setExporting(null);
        }
    }

    if (waitingForAuth || loading) {
        return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
                <StatusCard>Loading task details…</StatusCard>
            </div>
        );
    }

    if (unauthenticated) {
        return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
                <StatusCard
                    action={<BackToTasks />}
                >
                    Connect your wallet to view this task.
                </StatusCard>
            </div>
        );
    }

    if (!token) {
        return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
                <StatusCard action={<BackToTasks />}>
                    Wallet is connected, but sign-in did not finish. Approve the signature in Phantom, and make sure the API is running.
                </StatusCard>
            </div>
        );
    }

    if (error) {
        return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
                <StatusCard
                    action={
                        <div className="flex flex-wrap justify-center gap-3">
                            <button
                                type="button"
                                onClick={fetchTaskDetails}
                                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
                            >
                                Try again
                            </button>
                            <BackToTasks />
                        </div>
                    }
                >
                    {error}
                </StatusCard>
            </div>
        );
    }

    const totalVotes = Object.values(result).reduce((sum, item) => sum + item.count, 0);
    const required = taskDetails.required_submissions ?? totalVotes;
    const submitted = taskDetails.submission_count ?? totalVotes;
    const remaining = Math.max(0, required - submitted);
    const completion = required > 0 ? Math.round((submitted / required) * 100) : 0;
    const isDone = Boolean(taskDetails.done);
    const isTie = isDone && taskDetails.winner_option_id == null && totalVotes > 0;
    const cluster = "devnet";
    const payInUrl =
        taskDetails.signature && taskDetails.signature.length >= 64
            ? `https://explorer.solana.com/tx/${taskDetails.signature}?cluster=${cluster}`
            : null;
    const escrowUrl = taskDetails.escrow_pda
        ? `https://explorer.solana.com/address/${taskDetails.escrow_pda}?cluster=${cluster}`
        : null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                <BackToTasks />
                <div className="text-center mb-12 mt-6">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent mb-4">
                        {taskDetails.title || "Untitled Task"}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-3 text-slate-300">
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${
                                isDone
                                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                    : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            }`}
                        >
                            {isDone ? (isTie ? "Done · Tie" : "Done") : "Open"}
                        </span>
                        <span>
                            Votes:{" "}
                            <span className="text-cyan-300 font-semibold">
                                {submitted} / {required}
                            </span>
                        </span>
                        <span>
                            {completion}% complete
                            {!isDone && (
                                <>
                                    {" · "}
                                    <span className="text-white font-medium">{remaining} remaining</span>
                                </>
                            )}
                        </span>
                    </div>
                    {(payInUrl || escrowUrl || taskDetails.vote_commitment) && (
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm">
                            {payInUrl && (
                                <a
                                    className="text-cyan-300 hover:text-white"
                                    href={payInUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Payment tx
                                </a>
                            )}
                            {escrowUrl && (
                                <a
                                    className="text-cyan-300 hover:text-white"
                                    href={escrowUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Escrow PDA
                                </a>
                            )}
                            {taskDetails.settle_status && taskDetails.settle_status !== "Offchain" && (
                                <span className="text-slate-500">
                                    {taskDetails.settle_status}
                                    {taskDetails.vote_commitment
                                        ? ` · ${taskDetails.vote_commitment.slice(0, 8)}…`
                                        : ""}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                
                {Object.keys(result).length === 0 ? (
                    <div className="text-center bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                        <div className="text-slate-400 mb-2">No options available for this task yet.</div>
                        <div className="text-sm text-slate-500">Check back later for results.</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(result).map(([optionId, data]) => (
                            <Task 
                                key={optionId}
                                type={data.option.type}
                                content={data.option.content}
                                imageUrl={data.option.imageUrl} 
                                votes={data.count}
                                totalVotes={totalVotes}
                                isWinner={
                                    !isTie &&
                                    taskDetails.winner_option_id != null &&
                                    Number(optionId) === taskDetails.winner_option_id
                                }
                                isTie={isTie}
                            />
                        ))}
                    </div>
                )}
                {analytics && (
                    <AnalyticsPanel
                        analytics={analytics}
                        done={isDone}
                        exporting={exporting}
                        exportError={exportError}
                        onExport={downloadExport}
                    />
                )}
            </div>
        </div>
    );
}

function BackToTasks() {
    return (
        <Link href="/creator" className="text-sm text-slate-400 hover:text-white">
            ← Back to Tasks
        </Link>
    );
}

function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function formatTurnaround(ms: number | null, done: boolean) {
    if (!done || ms == null) {
        return "in progress";
    }
    const totalSec = Math.max(0, Math.round(ms / 1000));
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    if (minutes === 0) {
        return `${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
}

const BAR_COLORS = ["bg-violet-500", "bg-cyan-400", "bg-emerald-400", "bg-amber-400", "bg-pink-400"];

function AnalyticsPanel({
    analytics,
    done,
    exporting,
    exportError,
    onExport,
}: {
    analytics: PreviewTaskAnalytics;
    done: boolean;
    exporting: "csv" | "json" | null;
    exportError: string | null;
    onExport: (format: "csv" | "json") => void;
}) {
    const optionIds = [...new Set(analytics.timeline.flatMap((bucket) => Object.keys(bucket.counts)))];
    const maxTotal = Math.max(
        1,
        ...analytics.timeline.map((bucket) => Object.values(bucket.counts).reduce((sum, count) => sum + count, 0)),
    );

    return (
        <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-100">Analytics</h2>
                {done && analytics.underFiveMinutes && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        under 5 min
                    </span>
                )}
                <div className="ml-auto flex gap-2">
                    <button
                        type="button"
                        onClick={() => onExport("csv")}
                        disabled={exporting != null}
                        className="px-3 py-1.5 text-sm rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                    >
                        {exporting === "csv" ? "Exporting…" : "Export CSV"}
                    </button>
                    <button
                        type="button"
                        onClick={() => onExport("json")}
                        disabled={exporting != null}
                        className="px-3 py-1.5 text-sm rounded-md bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
                    >
                        {exporting === "json" ? "Exporting…" : "Export JSON"}
                    </button>
                </div>
            </div>
            {exportError && <p className="text-sm text-red-400">{exportError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
                    <div className="text-slate-400">Completion</div>
                    <div className="mt-1 text-lg font-semibold text-slate-100">
                        {analytics.submissionCount} / {analytics.requiredSubmissions}
                    </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
                    <div className="text-slate-400">Turnaround</div>
                    <div className="mt-1 text-lg font-semibold text-slate-100">
                        {formatTurnaround(analytics.turnaroundMs, done)}
                    </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
                    <div className="text-slate-400">Fill rate</div>
                    <div className="mt-1 text-lg font-semibold text-slate-100">
                        {Math.round(analytics.completionRate * 100)}%
                    </div>
                </div>
            </div>
            <div>
                <div className="text-sm text-slate-400 mb-3">Votes over time</div>
                {analytics.timeline.length === 0 ? (
                    <div className="text-sm text-slate-500">No votes yet.</div>
                ) : (
                    <div className="flex items-end gap-2 h-32">
                        {analytics.timeline.map((bucket) => {
                            const total = Object.values(bucket.counts).reduce((sum, count) => sum + count, 0);
                            const height = Math.max(8, Math.round((total / maxTotal) * 100));
                            return (
                                <div key={bucket.start} className="flex-1 min-w-0 flex flex-col items-center gap-1 h-full justify-end">
                                    <div
                                        className="w-full max-w-10 rounded-t overflow-hidden flex flex-col-reverse"
                                        style={{ height: `${height}%` }}
                                        title={`${new Date(bucket.start).toLocaleTimeString()} · ${total} votes`}
                                    >
                                        {optionIds.map((optionId, index) => {
                                            const count = bucket.counts[optionId] ?? 0;
                                            if (count === 0) {
                                                return null;
                                            }
                                            return (
                                                <div
                                                    key={optionId}
                                                    className={BAR_COLORS[index % BAR_COLORS.length]}
                                                    style={{ height: `${(count / total) * 100}%` }}
                                                />
                                            );
                                        })}
                                    </div>
                                    <span className="text-[10px] text-slate-500 truncate w-full text-center">
                                        {new Date(bucket.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusCard({
    children,
    action,
}: {
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <div className="max-w-lg mx-auto rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-10 text-center">
                <div className="text-lg font-medium text-slate-300">{children}</div>
                {action && <div className="mt-4">{action}</div>}
            </div>
        </div>
    );
}

function Task({type, content, imageUrl, votes, totalVotes, isWinner, isTie}: {
    type?: "Image" | "Text";
    content?: string;
    imageUrl: string;
    votes: number;
    totalVotes: number;
    isWinner: boolean;
    isTie: boolean;
}) {
    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    const isText = type === "Text";
    
    return (
        <div className={`group relative bg-slate-900/50 border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 ${
            isWinner
                ? "border-emerald-400/60 ring-1 ring-emerald-400/40"
                : "border-slate-800 hover:border-slate-700"
        }`}>
            <div className="relative aspect-[3/2] w-full">
                {isText ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 p-6">
                        <p className="text-center text-base leading-relaxed text-slate-100">{content}</p>
                    </div>
                ) : (
                    <img
                        src={imageUrl} 
                        alt="Task option"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                )}
                {(isWinner || isTie) && (
                    <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isWinner
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800/90 text-amber-300 border border-amber-400/40"
                    }`}>
                        {isWinner ? "Winner" : "Tie"}
                    </div>
                )}
                {!isText && (
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-semibold text-white">{votes}</span>
                        <span className="text-slate-400">{votes === 1 ? "vote" : "votes"}</span>
                    </div>
                    <div className="text-sm font-semibold text-cyan-300">
                        {percentage}%
                    </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                    <div 
                        className="bg-gradient-to-r from-violet-500 to-cyan-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
