FROM node:22-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_USE_MOCK_USERS=false
ARG NEXT_PUBLIC_USE_MOCK_EVENTS=false
ARG NEXT_PUBLIC_USE_MOCK_CHATS=false
ARG NEXT_PUBLIC_EVENT_API_URL=http://localhost:9001/eventservice/api
ARG NEXT_PUBLIC_USER_API_URL=http://localhost:9002/userservice/api
ARG NEXT_PUBLIC_REALTIME_WS_URL=ws://localhost:9003
ARG NEXT_PUBLIC_YANDEX_MAPS_API_KEY=fce65553-cdde-4e1c-a6f7-fc666ea72cb3
ARG NEXT_PUBLIC_YANDEX_SUGGEST_API_KEY=3ebf68b3-2a4c-4a6b-97b4-9b98ace26b5b

ENV NEXT_PUBLIC_USE_MOCK_USERS=$NEXT_PUBLIC_USE_MOCK_USERS
ENV NEXT_PUBLIC_USE_MOCK_EVENTS=$NEXT_PUBLIC_USE_MOCK_EVENTS
ENV NEXT_PUBLIC_USE_MOCK_CHATS=$NEXT_PUBLIC_USE_MOCK_CHATS
ENV NEXT_PUBLIC_EVENT_API_URL=$NEXT_PUBLIC_EVENT_API_URL
ENV NEXT_PUBLIC_USER_API_URL=$NEXT_PUBLIC_USER_API_URL
ENV NEXT_PUBLIC_REALTIME_WS_URL=$NEXT_PUBLIC_REALTIME_WS_URL
ENV NEXT_PUBLIC_YANDEX_MAPS_API_KEY=$NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ENV NEXT_PUBLIC_YANDEX_SUGGEST_API_KEY=$NEXT_PUBLIC_YANDEX_SUGGEST_API_KEY

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
