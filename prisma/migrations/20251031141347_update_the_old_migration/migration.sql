/*
  Warnings:

  - You are about to drop the `DocumentVersion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."DocumentVersion" DROP CONSTRAINT "DocumentVersion_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DocumentVersion" DROP CONSTRAINT "DocumentVersion_fileId_fkey";

-- DropTable
DROP TABLE "public"."DocumentVersion";

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'document',
    "fileId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_fileId_version_type_key" ON "document_versions"("fileId", "version", "type");

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
