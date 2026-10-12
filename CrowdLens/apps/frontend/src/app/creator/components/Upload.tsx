"use client";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { createTaskInstruction } from "crowdlens-idl";
import { UploadImage } from "./UploadImage";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import axios from "axios";
import { isUiPreview, MOCK_ECONOMICS, PREVIEW_TASK_ID } from "@/lib/ui-preview";
import { api } from "@/lib/api";
import { clampVoteCount, FALLBACK_ECONOMICS, type Economics } from "@/lib/economics";
import { formatSol, formatUsd, formatUsdAndSol, lamportsToUsd } from "@/lib/money";
import { VoteCountControl } from "@/components/VoteCountControl";
import {
  clearPendingTask,
  loadPendingTask,
  savePendingTask,
} from "@/lib/pending-task";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

export const Upload = () => {
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [economics, setEconomics] = useState<Economics | null>(isUiPreview ? MOCK_ECONOMICS : null);
  const [quotedLamportsPerVote, setQuotedLamportsPerVote] = useState<number | null>(null);
  const [requiredSubmissions, setRequiredSubmissions] = useState(1);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const finishedRef = useRef(false);

  useEffect(() => {
    const pending = loadPendingTask();
    if (pending) {
      setTitle(pending.title);
      setImages(pending.images);
      setTxSignature(pending.signature);
      setRequiredSubmissions(pending.requiredSubmissions);
      if (pending.quotedLamportsPerVote) {
        setQuotedLamportsPerVote(pending.quotedLamportsPerVote);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (isUiPreview) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await api.get<Economics>("/economics");
        if (cancelled) {
          return;
        }
        const next = { ...FALLBACK_ECONOMICS, ...response.data };
        setEconomics(next);
        setRequiredSubmissions((current) => clampVoteCount(current, next));
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const shownEconomics = economics ?? MOCK_ECONOMICS;
  const lamportsPerVote = quotedLamportsPerVote ?? shownEconomics.lamportsPerVote;
  const priceLamports = useMemo(() => {
    return requiredSubmissions * lamportsPerVote;
  }, [lamportsPerVote, requiredSubmissions]);

  useEffect(() => {
    if (!ready || finishedRef.current) {
      return;
    }
    savePendingTask({
      signature: txSignature,
      title,
      images,
      requiredSubmissions,
      quotedLamportsPerVote: quotedLamportsPerVote ?? undefined,
    });
  }, [ready, txSignature, title, images, requiredSubmissions, quotedLamportsPerVote]);

  function changeVoteCount(size: number) {
    const next = clampVoteCount(size, shownEconomics);
    setRequiredSubmissions(next);
    if (next !== requiredSubmissions) {
      setTxSignature("");
      setQuotedLamportsPerVote(null);
    }
  }

  function markFinished() {
    finishedRef.current = true;
    clearPendingTask();
  }

  async function submitTask(signature: string, quote = lamportsPerVote) {
    const response = await api.post("/task", {
      optionType: "image",
      options: images.map((image) => ({ imageUrl: image })),
      title,
      signature,
      requiredSubmissions,
      quotedLamportsPerVote: quote,
    });
    markFinished();
    setTxSignature("");
    router.push(`/creator/task/${response.data.id}`);
  }

  async function onSubmit() {
    try {
      setLoading(true);
      toast.loading("Submitting task...");

      if (isUiPreview) {
        toast.dismiss();
        toast.success("Task created!");
        markFinished();
        router.push(`/creator/task/${PREVIEW_TASK_ID}`);
        return;
      }

      await submitTask(txSignature);
      toast.dismiss();
      toast.success("Task created!");
    } catch (err) {
      toast.dismiss();
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        markFinished();
        toast.success("This payment already created a task");
        router.push("/creator");
        return;
      }
      toast.error(
        axios.isAxiosError(err) ? err.response?.data?.error || "Failed to submit task." : "Failed to submit task.",
      );
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  async function makePayment() {
    if (isUiPreview) {
      setTxSignature("ui-preview");
      toast.success("Payment skipped in UI preview");
      return;
    }

    try {
      if (!publicKey) return toast.error("Wallet not connected");
      setLoading(true);

      const quoteResponse = await api.get<Economics>("/economics");
      const fresh = { ...FALLBACK_ECONOMICS, ...quoteResponse.data };
      setEconomics(fresh);
      const quote = fresh.lamportsPerVote;
      const totalLamports = requiredSubmissions * quote;
      setQuotedLamportsPerVote(quote);

      toast.loading(`Sending ${formatSol(totalLamports)} SOL...`);

      const transaction = new Transaction();
      if (fresh.settlementMode === "onchain") {
        if (!fresh.programId) {
          toast.dismiss();
          toast.error("On-chain program is not configured");
          return;
        }
        const params = await api.get<{
          programId: string;
          nonce: number;
          taskPda: string;
          amount: number;
        }>("/task/onchain-params", {
          params: { requiredSubmissions, quotedLamportsPerVote: quote },
        });
        transaction.add(
          createTaskInstruction({
            creator: publicKey,
            amount: params.data.amount,
            required: requiredSubmissions,
            nonce: params.data.nonce,
            programId: new PublicKey(fresh.programId),
          }),
        );
      } else {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(fresh.treasuryAddress),
            lamports: totalLamports,
          }),
        );
      }

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();

      const signature = await sendTransaction(transaction, connection, { minContextSlot });

      await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });

      setTxSignature(signature);
      savePendingTask({
        signature,
        title,
        images,
        requiredSubmissions,
        quotedLamportsPerVote: quote,
      });
      toast.dismiss();
      toast.success("Payment successful!");
      toast.loading("Submitting task...");
      try {
        await submitTask(signature, quote);
        toast.dismiss();
        toast.success("Task created!");
      } catch (err) {
        toast.dismiss();
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          markFinished();
          toast.success("This payment already created a task");
          router.push("/creator");
          return;
        }
        toast.error(
          axios.isAxiosError(err)
            ? err.response?.data?.error || "Paid, but submit failed. Try Submit Task."
            : "Paid, but submit failed. Try Submit Task.",
        );
      }
    } catch (err) {
        console.log(err)
        toast.dismiss();
        toast.error("Payment failed.");
    } finally {
      setLoading(false);
    }
  }

  const optionsReady = images.length >= MIN_OPTIONS && images.length <= MAX_OPTIONS;
  const canPay = optionsReady && (isUiPreview || Boolean(economics));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="max-w-3xl space-y-8">
        <div>
          <p className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">Solana Devnet · content oracle</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-fg md:text-4xl">
            Create a task
          </h1>
          <p className="mt-2 text-fg-muted">
            Upload two to five images. You pay {formatUsd(shownEconomics.usdPerVoteCreator)} per vote in SOL.
          </p>
        </div>

        <div className="space-y-6 rounded-2xl border border-line bg-card p-5 sm:p-6">
        <div className="space-y-1">
          <label className="text-xs font-semibold tracking-wider text-fg-muted uppercase">Task title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Choose the best thumbnail"
            className="w-full rounded-lg border border-line bg-subtle p-3 text-sm text-fg placeholder:text-fg-muted focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label className="text-xs font-semibold tracking-wider text-fg-muted uppercase">How many votes?</label>
              <p className="mt-1 text-xs text-fg-muted">
                {shownEconomics.minVotes}–{shownEconomics.maxVotes} · {formatUsd(shownEconomics.usdPerVoteCreator)} each
              </p>
            </div>
            <VoteCountControl
              value={requiredSubmissions}
              economics={shownEconomics}
              disabled={loading}
              onChange={changeVoteCount}
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <PriceTile
              label="You pay"
              usd={lamportsToUsd(priceLamports, shownEconomics.solUsd)}
              sol={formatSol(priceLamports)}
              emphasis="creator"
            />
            <PriceTile
              label="Voters earn"
              usd={lamportsToUsd(
                requiredSubmissions * shownEconomics.lamportsPerVotePayout,
                shownEconomics.solUsd,
              )}
              sol={formatSol(requiredSubmissions * shownEconomics.lamportsPerVotePayout)}
              emphasis="voter"
            />
          </div>
          <p className="mt-4 text-sm text-fg-muted">
            Charged in SOL at the live rate. Wallet transfer: {formatSol(priceLamports)} SOL.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-wider text-fg-muted uppercase">
            Image options <span className="font-normal lowercase tracking-normal">({images.length}/{MAX_OPTIONS}, min {MIN_OPTIONS})</span>
          </label>
          <p className="text-xs text-fg-muted">Select several images at once. Only image files are accepted.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={`${image}-${index}`} className="overflow-hidden rounded-xl border border-line bg-subtle">
                <div className="relative">
                  <span className="absolute top-2 left-2 rounded-full bg-canvas/80 px-2 py-0.5 text-xs text-fg">
                    Option {String.fromCharCode(65 + index)}
                  </span>
                  <img
                    src={image}
                    alt="Uploaded"
                    className="h-40 w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
                  disabled={loading}
                  className="w-full py-2 text-xs text-rose-400 hover:bg-card"
                >
                  Remove
                </button>
              </div>
            ))}
            {images.length < MAX_OPTIONS && (
              <UploadImage
                disabled={loading}
                maxFiles={MAX_OPTIONS - images.length}
                onImageAdded={(imageUrl) => {
                  setImages((current) =>
                    current.length >= MAX_OPTIONS ? current : [...current, imageUrl],
                  );
                }}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-fg-muted">Funds stay in Solana Devnet escrow until the batch fills.</p>
          <button
            onClick={isUiPreview || txSignature ? onSubmit : makePayment}
            disabled={loading || !canPay}
            className={`rounded-lg bg-violet-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-600 ${loading || !canPay ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {loading
              ? isUiPreview || txSignature
                ? "Submitting..."
                : "Paying..."
              : isUiPreview || txSignature
              ? "Submit Task"
              : `Pay ${formatUsdAndSol(priceLamports, shownEconomics.solUsd)}`}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

function PriceTile({
  label,
  usd,
  sol,
  emphasis,
}: {
  label: string;
  usd: number;
  sol: string;
  emphasis: "creator" | "voter";
}) {
  return (
    <div className="rounded-xl border border-line bg-subtle px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-fg">{formatUsd(usd)}</p>
      <p className={`mt-1 text-sm ${emphasis === "voter" ? "text-emerald-400" : "text-cyan-400"}`}>
        {sol} SOL
      </p>
    </div>
  );
}
