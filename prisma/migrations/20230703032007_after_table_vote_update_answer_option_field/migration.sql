/*
  Warnings:

  - You are about to drop the column `answerOptionId` on the `Vote` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_answerOptionId_fkey";

-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "answerOptionId";

-- CreateTable
CREATE TABLE "_AnswerOptionToVote" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AnswerOptionToVote_AB_unique" ON "_AnswerOptionToVote"("A", "B");

-- CreateIndex
CREATE INDEX "_AnswerOptionToVote_B_index" ON "_AnswerOptionToVote"("B");

-- AddForeignKey
ALTER TABLE "_AnswerOptionToVote" ADD CONSTRAINT "_AnswerOptionToVote_A_fkey" FOREIGN KEY ("A") REFERENCES "AnswerOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnswerOptionToVote" ADD CONSTRAINT "_AnswerOptionToVote_B_fkey" FOREIGN KEY ("B") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
