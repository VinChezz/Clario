/*
  Warnings:

  - You are about to drop the column `language` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `UserSettings` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'FOCUS', 'MEETING', 'OOO', 'CUSTOM');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "language",
ADD COLUMN     "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "customStatus" TEXT,
ADD COLUMN     "showPresence" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "language";
