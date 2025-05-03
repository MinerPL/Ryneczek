-- CreateTable
CREATE TABLE "Hostings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hosting_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT,
    "website" TEXT,
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "Offerts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "messageId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hostingId" INTEGER NOT NULL,
    "email" TEXT,
    "exchange" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "additionalInfo" TEXT,
    "verifiedCount" BOOLEAN NOT NULL,
    "selled" BOOLEAN NOT NULL,
    CONSTRAINT "Offerts_hostingId_fkey" FOREIGN KEY ("hostingId") REFERENCES "Hostings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Opinions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user" TEXT NOT NULL,
    "positive" BOOLEAN NOT NULL,
    "comment" TEXT
);
