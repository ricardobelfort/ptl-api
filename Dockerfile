FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node","dist/server.js"]
