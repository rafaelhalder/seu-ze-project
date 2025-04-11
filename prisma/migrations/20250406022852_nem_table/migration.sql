/*
  Warnings:

  - You are about to drop the column `negativeTopics` on the `emotional_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `positiveTopics` on the `emotional_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `volatility` on the `emotional_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `sentimentConfidence` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `sentimentLabel` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `sentimentScore` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the `message_emotions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_sentiments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "message_emotions" DROP CONSTRAINT "message_emotions_messageId_fkey";

-- DropForeignKey
ALTER TABLE "user_sentiments" DROP CONSTRAINT "user_sentiments_user_id_fkey";

-- AlterTable
ALTER TABLE "emotional_profiles" DROP COLUMN "negativeTopics",
DROP COLUMN "positiveTopics",
DROP COLUMN "volatility",
ADD COLUMN     "preferenceData" TEXT;

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "sentimentConfidence",
DROP COLUMN "sentimentLabel",
DROP COLUMN "sentimentScore",
ADD COLUMN     "emotions" TEXT,
ADD COLUMN     "sentiment" DOUBLE PRECISION;

-- DropTable
DROP TABLE "message_emotions";

-- DropTable
DROP TABLE "user_sentiments";
