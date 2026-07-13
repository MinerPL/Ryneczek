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
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "middleman" BOOLEAN NOT NULL DEFAULT false,
    "realCount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sales_offertId_fkey" FOREIGN KEY ("offertId") REFERENCES "Offerts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sales" ("amount", "buyerId", "channelId", "createdAt", "id", "isDone", "middleman", "offertId", "realCount") SELECT "amount", "buyerId", "channelId", "createdAt", "id", "isDone", "middleman", "offertId", "realCount" FROM "Sales";
DROP TABLE "Sales";
ALTER TABLE "new_Sales" RENAME TO "Sales";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
