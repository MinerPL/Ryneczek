FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

RUN npx prisma generate

COPY . .

RUN yarn build

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app .

CMD ["yarn", "start"]
