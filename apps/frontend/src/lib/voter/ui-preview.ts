export type PreviewTask = {
  id: number;
  amount: number;
  reward: number;
  required_submissions: number;
  submission_count: number;
  title: string;
  options: {
    id: number;
    image_url: string;
    content?: string;
    type?: "Image" | "Text";
    task_id: number;
  }[];
};

export type PreviewStats = {
  pendingBal: number;
  lockedBal: number;
  unsettledBal: number;
  minPayout: number;
  votesSubmitted: number;
  totalEarned: number;
  reputation: number;
  alignedVotes: number;
  outlierVotes: number;
};

export type PreviewSubmission = {
  id: number;
  amount: number;
  comment: string | null;
  payout_signature?: string | null;
  task: { id: number; title: string; done: boolean };
  option: { id: number; image_url: string; content?: string; type?: "Image" | "Text" };
};

const PEXELS_A =
  "https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg";
const PEXELS_B =
  "https://images.pexels.com/photos/5409751/pexels-photo-5409751.jpeg";
const PEXELS_C =
  "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg";
const PEXELS_D =
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg";

export const MOCK_WORKER_TASKS: PreviewTask[] = [
  {
    id: 3,
    amount: 5_000_000,
    reward: 1_000_000,
    required_submissions: 5,
    submission_count: 1,
    title: "Which caption would you click?",
    options: [
      {
        id: 10,
        image_url: "",
        content: "I tried the viral hack. Here's what happened.",
        type: "Text",
        task_id: 3,
      },
      {
        id: 11,
        image_url: "",
        content: "Stop scrolling. This one actually works.",
        type: "Text",
        task_id: 3,
      },
    ],
  },
  {
    id: 1,
    amount: 1_000_000,
    reward: 1_000_000,
    required_submissions: 5,
    submission_count: 2,
    title: "Choose the best thumbnail",
    options: [
      { id: 1, image_url: PEXELS_A, content: "", type: "Image", task_id: 1 },
      { id: 2, image_url: PEXELS_B, content: "", type: "Image", task_id: 1 },
      { id: 3, image_url: PEXELS_C, content: "", type: "Image", task_id: 1 },
    ],
  },
  {
    id: 2,
    amount: 5_000_000,
    reward: 1_000_000,
    required_submissions: 5,
    submission_count: 1,
    title: "Which image looks more authentic?",
    options: [
      { id: 4, image_url: PEXELS_D, content: "", type: "Image", task_id: 2 },
      { id: 5, image_url: PEXELS_A, content: "", type: "Image", task_id: 2 },
    ],
  },
];

export type PreviewTaskRow = {
  id: number;
  title: string;
  amount: number;
  reward: number;
  required_submissions: number;
  submission_count: number;
  optionType: "Image" | "Text";
  preview: string | null;
  thumbnail: string | null;
};

export const MOCK_WORKER_TASK_ROWS: PreviewTaskRow[] = [
  {
    id: 3,
    title: "Which caption would you click?",
    amount: 5_000_000,
    reward: 1_000_000,
    required_submissions: 5,
    submission_count: 1,
    optionType: "Text",
    preview: "I tried the viral hack. Here's what happened.",
    thumbnail: null,
  },
  {
    id: 1,
    title: "Choose the best thumbnail",
    amount: 1_000_000,
    reward: 1_000_000,
    required_submissions: 5,
    submission_count: 2,
    optionType: "Image",
    preview: PEXELS_A,
    thumbnail: PEXELS_A,
  },
  {
    id: 2,
    title: "Which image looks more authentic?",
    amount: 5_000_000,
    reward: 1_000_000,
    required_submissions: 5,
    submission_count: 1,
    optionType: "Image",
    preview: PEXELS_D,
    thumbnail: PEXELS_D,
  },
];

export const MOCK_WORKER_STATS: PreviewStats = {
  pendingBal: 2_000_000,
  lockedBal: 0,
  unsettledBal: 1_000_000,
  minPayout: 1_000_000,
  votesSubmitted: 3,
  totalEarned: 3_000_000,
  reputation: 54,
  alignedVotes: 2,
  outlierVotes: 1,
};

export const MOCK_WORKER_SUBMISSIONS: PreviewSubmission[] = [
  {
    id: 3,
    amount: 1_000_000,
    comment: "The first hook is more specific",
    task: { id: 3, title: "Which caption would you click?", done: false },
    option: {
      id: 10,
      image_url: "",
      content: "I tried the viral hack. Here's what happened.",
      type: "Text",
    },
  },
  {
    id: 1,
    amount: 1_000_000,
    comment: "Left thumbnail is clearer at small sizes",
    task: { id: 1, title: "Choose the best thumbnail", done: true },
    option: { id: 1, image_url: PEXELS_A, content: "", type: "Image" },
  },
  {
    id: 2,
    amount: 1_000_000,
    comment: null,
    task: { id: 2, title: "Which image looks more authentic?", done: false },
    option: { id: 4, image_url: PEXELS_D, content: "", type: "Image" },
  },
];
