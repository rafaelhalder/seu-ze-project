/*
  Warnings:

  - A unique constraint covering the columns `[user_id,date]` on the table `user_sentiments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "sentimentConfidence" DOUBLE PRECISION,
ADD COLUMN     "sentimentLabel" TEXT,
ADD COLUMN     "sentimentScore" DOUBLE PRECISION,
ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "user_sentiments" ADD COLUMN     "averageWeekly" DOUBLE PRECISION,
ADD COLUMN     "dominantEmotions" TEXT,
ADD COLUMN     "emotionalTrend" TEXT;

-- CreateTable
CREATE TABLE "message_emotions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "intensity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_emotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emotional_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "baselineSentiment" DOUBLE PRECISION NOT NULL,
    "volatility" DOUBLE PRECISION,
    "positiveTopics" TEXT,
    "negativeTopics" TEXT,
    "commonEmotions" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emotional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_emotions_messageId_emotion_key" ON "message_emotions"("messageId", "emotion");

-- CreateIndex
CREATE UNIQUE INDEX "emotional_profiles_user_id_key" ON "emotional_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sentiments_user_id_date_key" ON "user_sentiments"("user_id", "date");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_emotions" ADD CONSTRAINT "message_emotions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_profiles" ADD CONSTRAINT "emotional_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
