/*
  Warnings:

  - You are about to alter the column `amount` on the `Sales` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offertId" INTEGER NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "channelId" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sales_offertId_fkey" FOREIGN KEY ("offertId") REFERENCES "Offerts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sales" ("amount", "buyerId", "channelId", "createdAt", "id", "isDone", "offertId") SELECT "amount", "buyerId", "channelId", "createdAt", "id", "isDone", "offertId" FROM "Sales";
DROP TABLE "Sales";
ALTER TABLE "new_Sales" RENAME TO "Sales";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
