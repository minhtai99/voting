/*
  Warnings:

  - A unique constraint covering the columns `[pollId,participantId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Vote_pollId_participantId_key" ON "Vote"("pollId", "participantId");
