-- CreateTable
CREATE TABLE "PollResult" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "answer" TEXT[],
    "pollId" INTEGER NOT NULL,

    CONSTRAINT "PollResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PollResult_id_key" ON "PollResult"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PollResult_pollId_key" ON "PollResult"("pollId");

-- AddForeignKey
ALTER TABLE "PollResult" ADD CONSTRAINT "PollResult_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
