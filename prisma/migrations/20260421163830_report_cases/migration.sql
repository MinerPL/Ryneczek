-- CreateTable
CREATE TABLE "ReportCases" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caseRef" TEXT NOT NULL,
    "logChannelId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedChannelId" TEXT NOT NULL,
    "reporterChannelId" TEXT NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "closedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportCases_caseRef_key" ON "ReportCases"("caseRef");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCases_reportedChannelId_key" ON "ReportCases"("reportedChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCases_reporterChannelId_key" ON "ReportCases"("reporterChannelId");
