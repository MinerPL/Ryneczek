/*
  Warnings:

  - You are about to drop the column `email` on the `Offerts` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Profile" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "opinionThread" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Offerts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "messageId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hostingId" INTEGER NOT NULL,
    "exchange" REAL NOT NULL,
    "count" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "additionalInfo" TEXT,
    "verifiedCount" BOOLEAN NOT NULL,
    "sold" BOOLEAN NOT NULL,
    CONSTRAINT "Offerts_hostingId_fkey" FOREIGN KEY ("hostingId") REFERENCES "Hostings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Offerts" ("additionalInfo", "channelId", "count", "exchange", "hostingId", "id", "messageId", "paymentMethod", "sold", "userId", "verifiedCount") SELECT "additionalInfo", "channelId", "count", "exchange", "hostingId", "id", "messageId", "paymentMethod", "sold", "userId", "verifiedCount" FROM "Offerts";
DROP TABLE "Offerts";
ALTER TABLE "new_Offerts" RENAME TO "Offerts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
