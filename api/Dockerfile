FROM oven/bun:1

WORKDIR /app

# Install Stockfish engine for chess-bot module
RUN apt-get update \
  && apt-get install -y --no-install-recommends stockfish \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN bun install

COPY . .

EXPOSE 4000

CMD ["bun", "index.ts"]
