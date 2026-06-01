# Local FEN Puzzle Generation

This generator creates chess puzzles from FEN positions locally and writes them to a JSON file.
It does not connect to MongoDB and does not upload puzzles to production.

## Input

Put FEN positions into:

```text
fen-puzzles/input/fens.txt
```

Use one FEN per line:

```text
r3k2B/1p2p2p/2b3p1/p1P5/P2P4/2P2P2/2n1Q1PP/R3K2R w KQq - 0 1
```

Blank lines and lines starting with `#` are ignored.

## Run

From the project root:

```bash
docker compose -f dev-compose.yml run --rm fen-puzzle-generator
```

## Output

Generated puzzles will be written to:

```text
fen-puzzles/output/puzzles.json
```

The file contains an array of puzzle objects ready to upload from `/admin` on the `Puzzles` tab.

## Useful Options

You can override generation settings with environment variables:

```bash
FEN_PUZZLE_LIMIT=5 \
FEN_PUZZLE_STATUS=draft \
FEN_PUZZLE_MOVE_TIME_MS=250 \
docker compose -f dev-compose.yml run --rm fen-puzzle-generator
```

Available variables:

- `FEN_PUZZLE_LIMIT` - max number of FEN positions to process.
- `FEN_PUZZLE_STATUS` - `draft` or `published`; default is `draft`.
- `FEN_PUZZLE_MOVE_TIME_MS` - Stockfish analysis time per move; default is `150`.
- `FEN_PUZZLE_MULTIPV` - number of engine lines to compare; default is `3`.
- `FEN_PUZZLE_OUTPUT_FILE` - custom output path inside the container.

## Import To Production

1. Open `/admin`.
2. Go to the `Puzzles` tab.
3. Upload `fen-puzzles/output/puzzles.json` in `Import generated puzzles`.
4. Check the import summary for imported, duplicate and invalid puzzles.
