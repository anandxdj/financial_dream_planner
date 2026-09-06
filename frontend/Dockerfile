FROM node:22-alpine AS build
WORKDIR /app
ENV CI=true
RUN corepack enable
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./frontend/
COPY sdk ./sdk
RUN cd sdk && pnpm install --frozen-lockfile
WORKDIR /app/frontend
ARG API_ORIGIN=http://api:4000
ENV API_ORIGIN=${API_ORIGIN}
RUN pnpm install --frozen-lockfile
COPY frontend .
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app/frontend
ENV NODE_ENV=production
RUN corepack enable
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
COPY sdk /app/sdk
RUN cd /app/sdk && pnpm install --prod --frozen-lockfile
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/frontend/.next ./.next
COPY --from=build /app/frontend/public ./public
USER node
EXPOSE 3000
CMD ["pnpm", "start"]
