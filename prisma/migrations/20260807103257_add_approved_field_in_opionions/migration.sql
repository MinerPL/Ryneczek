-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Opinions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "positive" BOOLEAN NOT NULL,
    "comment" TEXT,
    "surveyResults" JSONB NOT NULL DEFAULT [],
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "messageId" TEXT NOT NULL DEFAULT '',
    "messageChannelId" TEXT NOT NULL DEFAULT '',
    "saleId" INTEGER,
    CONSTRAINT "Opinions_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sales" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Opinions" ("addedBy", "comment", "id", "positive", "saleId", "surveyResults", "user") SELECT "addedBy", "comment", "id", "positive", "saleId", "surveyResults", "user" FROM "Opinions";
DROP TABLE "Opinions";
ALTER TABLE "new_Opinions" RENAME TO "Opinions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
