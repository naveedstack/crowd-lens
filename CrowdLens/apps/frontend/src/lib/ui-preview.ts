export const isUiPreview = !process.env.NEXT_PUBLIC_BACKEND_URL;

export const PREVIEW_TASK_ID = "preview";
export const PREVIEW_CAPTION_TASK_ID = "3";

const PEXELS_A =
  "https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg";
const PEXELS_B =
  "https://images.pexels.com/photos/5409751/pexels-photo-5409751.jpeg";
const PEXELS_C =
  "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg";

export const MOCK_ECONOMICS = {
  treasuryAddress: "5tm9oN2bpTxFdELx9ddcxjFG9HD4NQHdkdz3CYm25EQj",
  solUsd: 120,
  usdPerVoteCreator: 1,
  usdPerVoteVoter: 0.5,
  lamportsPerVote: 8_333_333,
  lamportsPerVotePayout: 4_166_666,
  minVotes: 1,
  maxVotes: 100,
  settlementMode: "custodial" as const,
  programId: null as string | null,
};

export type PreviewTaskRow = {
  id: number;
  title: string;
  done: boolean;
  amount: number;
  required_submissions: number;
  submission_count: number;
  winner_option_id: number | null;
  thumbnail: string | null;
  optionType?: "Image" | "Text";
  preview?: string | null;
};

export const MOCK_TASK_LIST: PreviewTaskRow[] = [
  {
    id: 3,
    title: "Which caption would you click?",
    done: false,
    amount: 5_000_000,
    required_submissions: 5,
    submission_count: 1,
    winner_option_id: null,
    thumbnail: null,
    optionType: "Text",
    preview: "I tried the viral hack. Here's what happened.",
  },
  {
    id: 2,
    title: "Which image looks more authentic?",
    done: false,
    amount: 5_000_000,
    required_submissions: 5,
    submission_count: 2,
    winner_option_id: null,
    thumbnail: PEXELS_B,
    optionType: "Image",
    preview: PEXELS_B,
  },
  {
    id: 1,
    title: "Choose the best thumbnail",
    done: true,
    amount: 1_000_000,
    required_submissions: 1,
    submission_count: 1,
    winner_option_id: 1,
    thumbnail: PEXELS_A,
    optionType: "Image",
    preview: PEXELS_A,
  },
];

export const MOCK_TASK_DETAILS = {
  title: "Choose the best thumbnail",
  done: true,
  required_submissions: 115,
  submission_count: 115,
  winner_option_id: 1,
  signature: "preview-signature",
  escrow_pda: null as string | null,
  vote_commitment: null as string | null,
  settle_status: "Offchain",
};

export const MOCK_CAPTION_TASK_DETAILS = {
  title: "Which caption would you click?",
  done: false,
  required_submissions: 5,
  submission_count: 3,
  winner_option_id: 10,
  signature: "preview-caption-signature",
  escrow_pda: null as string | null,
  vote_commitment: null as string | null,
  settle_status: "Offchain",
};

export type PreviewTaskResult = {
  count: number;
  option: {
    type: "Image" | "Text";
    content: string;
    imageUrl: string;
  };
};

export const MOCK_TASK_RESULTS: Record<string, PreviewTaskResult> = {
  "1": { count: 72, option: { type: "Image", content: "", imageUrl: PEXELS_A } },
  "2": { count: 28, option: { type: "Image", content: "", imageUrl: PEXELS_B } },
  "3": { count: 15, option: { type: "Image", content: "", imageUrl: PEXELS_C } },
};

export const MOCK_CAPTION_TASK_RESULTS: Record<string, PreviewTaskResult> = {
  "10": {
    count: 2,
    option: {
      type: "Text",
      content: "I tried the viral hack. Here's what happened.",
      imageUrl: "",
    },
  },
  "11": {
    count: 1,
    option: {
      type: "Text",
      content: "Stop scrolling. This one actually works.",
      imageUrl: "",
    },
  },
};

export type PreviewTaskAnalytics = {
  completionRate: number;
  submissionCount: number;
  requiredSubmissions: number;
  startedAt: string | null;
  completedAt: string | null;
  turnaroundMs: number | null;
  underFiveMinutes: boolean | null;
  timeline: Array<{ start: string; counts: Record<string, number> }>;
};

export const MOCK_TASK_ANALYTICS: PreviewTaskAnalytics = {
  completionRate: 1,
  submissionCount: 115,
  requiredSubmissions: 115,
  startedAt: "2026-09-22T08:00:00.000Z",
  completedAt: "2026-09-22T08:03:40.000Z",
  turnaroundMs: 220_000,
  underFiveMinutes: true,
  timeline: [
    { start: "2026-09-22T08:00:00.000Z", counts: { "1": 40, "2": 10, "3": 5 } },
    { start: "2026-09-22T08:01:00.000Z", counts: { "1": 20, "2": 10, "3": 5 } },
    { start: "2026-09-22T08:02:00.000Z", counts: { "1": 12, "2": 8, "3": 5 } },
  ],
};

export const MOCK_CAPTION_TASK_ANALYTICS: PreviewTaskAnalytics = {
  completionRate: 0.6,
  submissionCount: 3,
  requiredSubmissions: 5,
  startedAt: "2026-09-22T08:10:00.000Z",
  completedAt: null,
  turnaroundMs: null,
  underFiveMinutes: null,
  timeline: [
    { start: "2026-09-22T08:10:00.000Z", counts: { "10": 1 } },
    { start: "2026-09-22T08:11:00.000Z", counts: { "10": 1, "11": 1 } },
  ],
};

export type PreviewKpiTargets = {
  votes: number;
  uniqueValidators: number;
  uniqueCreators: number;
  underFiveMinutesRate: number;
};

export type PreviewPilotStats = {
  votes: number;
  uniqueValidators: number;
  uniqueCreators: number;
  tasks: number;
  tasksDone: number;
  avgTurnaroundMs: number | null;
  underFiveMinutesRate: number | null;
};

export type PreviewPlatformStats = {
  votes: number;
  uniqueValidators: number;
  tasks: number;
  tasksDone: number;
  avgTurnaroundMs: number | null;
  underFiveMinutesRate: number | null;
  leaderboard: Array<{
    rank: number;
    addressPreview: string;
    reputation: number;
    alignedVotes: number;
    votes: number;
  }>;
  targets: PreviewKpiTargets;
  pilot: PreviewPilotStats;
};

export const MOCK_PLATFORM_STATS: PreviewPlatformStats = {
  votes: 128,
  uniqueValidators: 14,
  tasks: 6,
  tasksDone: 3,
  avgTurnaroundMs: 180_000,
  underFiveMinutesRate: 1,
  leaderboard: [
    { rank: 1, addressPreview: "7kQp…9mNx", reputation: 62, alignedVotes: 8, votes: 9 },
    { rank: 2, addressPreview: "3fLa…2pQr", reputation: 58, alignedVotes: 5, votes: 6 },
    { rank: 3, addressPreview: "9bHs…4tUv", reputation: 54, alignedVotes: 2, votes: 3 },
  ],
  targets: {
    votes: 10_000,
    uniqueValidators: 500,
    uniqueCreators: 5,
    underFiveMinutesRate: 1,
  },
  pilot: {
    votes: 12,
    uniqueValidators: 4,
    uniqueCreators: 2,
    tasks: 3,
    tasksDone: 1,
    avgTurnaroundMs: 180_000,
    underFiveMinutesRate: 1,
  },
};

