/*
  Warnings:

  - You are about to drop the column `plainPassword` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "plainPassword",
ADD COLUMN     "password" TEXT;
