# =============================================================================
# Cointier — Next.js 15 production Dockerfile (multi-stage, standalone output)
# =============================================================================
# Nixpacks の nix-env OOM 問題を回避するため代替ビルドパック.
# Coolify の build_pack を "dockerfile" に切替えると本ファイルが使用される.
# =============================================================================

# ---- Stage 1: deps（依存解決のみ・キャッシュ最適化）----------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# package*.json のみ先にコピーして npm ci → Docker layer cache を最大化
# --ignore-scripts で sharp 等の postinstall (native binary 取得) を deps stage では skip
# → メモリ使用量削減 (共有 Coolify host での OOM 回避)
# builder stage で `npm rebuild sharp --ignore-scripts=false` で必要なら復元
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --prefer-offline --ignore-scripts

# ---- Stage 2: builder（Next.js ビルド）---------------------------------------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Telemetry off + Node heap cap (共有 Coolify host OOM 回避策)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=3072
# Build 時にも env が必要なら ARG で受け取る (今回は build-time env なし)

# sharp の native binding を builder stage で rebuild (deps では --ignore-scripts なので)
RUN npm rebuild sharp --foreground-scripts || true

# Next.js build (output: 'standalone' で .next/standalone に slim runtime 出力)
# NODE_OPTIONS で heap を 3GB に制限 → 共有 host 8GB のうち 3GB 以上は使わない
RUN npm run build

# ---- Stage 3: runner（本番稼働 image・slim）---------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user (Z security rule)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 必要最小限のファイルのみコピー (sharp の native binding は standalone に含まれる)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
