CREATE TABLE "TimeBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "note" TEXT,
    "actualMinutes" INTEGER,
    "dailyPlanId" TEXT,
    "monthlyPlanId" TEXT,
    "goalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimeBlock_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "DailyPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimeBlock_monthlyPlanId_fkey" FOREIGN KEY ("monthlyPlanId") REFERENCES "MonthlyPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimeBlock_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "TimeBlock_date_idx" ON "TimeBlock"("date");
CREATE INDEX "TimeBlock_dailyPlanId_idx" ON "TimeBlock"("dailyPlanId");
CREATE INDEX "TimeBlock_monthlyPlanId_idx" ON "TimeBlock"("monthlyPlanId");
CREATE INDEX "TimeBlock_goalId_idx" ON "TimeBlock"("goalId");
