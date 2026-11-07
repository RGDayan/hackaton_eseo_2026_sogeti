# Image de production de Place Commune (Next.js standalone).
#
#   docker build -t place-commune .                  → image de l'application (cible par défaut)
#   docker build --target outils -t place-commune-outils .
#                                                    → CLI Prisma + seed (migrations au démarrage)
#
# Multi-architecture : se construit tel quel sur amd64 (VPS OVH) comme sur arm64 (Oracle Ampere).

ARG NODE_VERSION=24-alpine

# --- Dépendances (dont devDependencies : prisma, tsx, tailwind) ---------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
# Le postinstall lance `prisma generate` : il lui faut le schéma et la config.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# --- Outils : migrations et seed, lancés par le service `migrations` du compose ----------------
FROM deps AS outils
ENV NODE_ENV=production
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

# --- Build Next.js --------------------------------------------------------------------------------
FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

# --- Image finale ----------------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS app
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Dossier des pièces jointes : monté en volume, il hérite de ce propriétaire à la création.
RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node
EXPOSE 3000
CMD ["node", "server.js"]
