FROM node:22-slim
WORKDIR /app

RUN corepack enable

COPY . .
RUN [ "pnpm", "install", "--frozen-lockfile" ]
RUN [ "pnpm", "run", "build" ]

CMD [ "sh", "-c", "node dist/deploy-commands.js && exec node dist/index.js" ]
