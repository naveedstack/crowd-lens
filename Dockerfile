FROM oven/bun:1.2.3

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install --frozen-lockfile
RUN bun run --filter=db generate

ENV NODE_ENV=production
EXPOSE 8080

CMD ["sh", "-c", "bun run --filter=db migrate && bun run --filter=api start"]
