-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReportCases" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caseRef" TEXT NOT NULL,
    "logChannelId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedChannelId" TEXT,
    "reporterChannelId" TEXT,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "closedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME
);
INSERT INTO "new_ReportCases" ("caseRef", "closed", "closedAt", "closedBy", "createdAt", "id", "logChannelId", "reportedChannelId", "reportedId", "reporterChannelId", "reporterId") SELECT "caseRef", "closed", "closedAt", "closedBy", "createdAt", "id", "logChannelId", "reportedChannelId", "reportedId", "reporterChannelId", "reporterId" FROM "ReportCases";
DROP TABLE "ReportCases";
ALTER TABLE "new_ReportCases" RENAME TO "ReportCases";
CREATE UNIQUE INDEX "ReportCases_caseRef_key" ON "ReportCases"("caseRef");
CREATE UNIQUE INDEX "ReportCases_reportedChannelId_key" ON "ReportCases"("reportedChannelId");
CREATE UNIQUE INDEX "ReportCases_reporterChannelId_key" ON "ReportCases"("reporterChannelId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
