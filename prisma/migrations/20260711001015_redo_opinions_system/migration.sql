/*
  Warnings:

  - Added the required column `middleman` to the `Sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `realCount` to the `Sales` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Opinions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user" TEXT NOT NULL,
    "positive" BOOLEAN NOT NULL,
    "comment" TEXT,
    "surveyResults" JSONB NOT NULL DEFAULT [],
    "saleId" INTEGER,
    CONSTRAINT "Opinions_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sales" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Opinions" ("comment", "id", "positive", "saleId", "user") SELECT "comment", "id", "positive", "saleId", "user" FROM "Opinions";
DROP TABLE "Opinions";
ALTER TABLE "new_Opinions" RENAME TO "Opinions";
CREATE TABLE "new_Sales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offertId" INTEGER NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "channelId" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL,
    "middleman" BOOLEAN NOT NULL,
    "realCount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sales_offertId_fkey" FOREIGN KEY ("offertId") REFERENCES "Offerts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sales" ("amount", "buyerId", "channelId", "createdAt", "id", "isDone", "offertId") SELECT "amount", "buyerId", "channelId", "createdAt", "id", "isDone", "offertId" FROM "Sales";
DROP TABLE "Sales";
ALTER TABLE "new_Sales" RENAME TO "Sales";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
