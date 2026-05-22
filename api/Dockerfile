FROM oven/bun:1

WORKDIR /app

# Install Stockfish engine for chess-bot module
RUN apt-get update \
  && apt-get install -y --no-install-recommends stockfish \
  && rm -rf /var/lib/apt/lists/*

ENV BUN_CONFIG_MAX_HTTP_REQUESTS=2

COPY package.json bun.lockb* ./

RUN bun install --registry https://npm-mirror.gitverse.ru

COPY . .

EXPOSE 4000

CMD ["bun", "index.ts"]
