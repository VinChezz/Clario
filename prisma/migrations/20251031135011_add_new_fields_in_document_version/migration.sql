/*
  Warnings:

  - Added the required column `type` to the `DocumentVersion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DocumentVersion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."DocumentVersion" DROP CONSTRAINT "DocumentVersion_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DocumentVersion" DROP CONSTRAINT "DocumentVersion_fileId_fkey";

-- DropIndex
DROP INDEX "public"."DocumentVersion_fileId_idx";

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
