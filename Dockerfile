FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN npx prisma generate

COPY config.example.json config.json

RUN yarn build

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app .

CMD ["yarn", "start"]
