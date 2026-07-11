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
    "saleId" INTEGER,
    CONSTRAINT "Opinions_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sales" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- UPDATED INSERT STATEMENT
INSERT INTO "new_Opinions" ("id", "user", "positive", "comment", "surveyResults", "saleId", "addedBy")
SELECT
    O."id",
    O."user",
    O."positive",
    O."comment",
    O."surveyResults",
    O."saleId",
    COALESCE(
            CASE
                WHEN O."user" = S."buyerId" THEN Off."userId"
                ELSE S."buyerId"
                END,
            'UNKNOWN' -- Fallback if saleId is NULL to prevent NOT NULL constraint errors
    ) AS "addedBy"
FROM "Opinions" O
         LEFT JOIN "Sales" S ON O."saleId" = S."id"
         LEFT JOIN "Offerts" Off ON S."offertId" = Off."id";

DROP TABLE "Opinions";
ALTER TABLE "new_Opinions" RENAME TO "Opinions";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
