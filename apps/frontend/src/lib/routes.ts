export const validatorPaths = {
  guide: "/validators",
  votes: "/validators/votes",
  task: (id: string | number) => `/validators/task/${id}`,
  history: "/validators/history",
  earnings: "/validators/earnings",
} as const;
