-- CreateTable
CREATE TABLE "_PollResult" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PollResult_AB_unique" ON "_PollResult"("A", "B");

-- CreateIndex
CREATE INDEX "_PollResult_B_index" ON "_PollResult"("B");

-- AddForeignKey
ALTER TABLE "_PollResult" ADD CONSTRAINT "_PollResult_A_fkey" FOREIGN KEY ("A") REFERENCES "AnswerOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PollResult" ADD CONSTRAINT "_PollResult_B_fkey" FOREIGN KEY ("B") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
