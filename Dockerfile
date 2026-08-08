FROM node:22-slim
WORKDIR /app

RUN corepack enable

COPY . .
RUN [ "pnpm", "install", "--frozen-lockfile" ]
RUN [ "pnpm", "run", "build" ]

CMD [ "pnpm", "run", "deploy-and-start" ]
