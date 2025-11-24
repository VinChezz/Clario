/*
  Warnings:

  - A unique constraint covering the columns `[fileId,type,version]` on the table `document_versions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."document_versions_fileId_version_type_key";

-- CreateTable
CREATE TABLE "GithubRepository" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "fullUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GithubRepository_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GithubRepository_teamId_key" ON "GithubRepository"("teamId");

-- CreateIndex
CREATE INDEX "GithubRepository_teamId_idx" ON "GithubRepository"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "GithubRepository_owner_repo_key" ON "GithubRepository"("owner", "repo");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_fileId_type_version_key" ON "document_versions"("fileId", "type", "version");

-- AddForeignKey
ALTER TABLE "GithubRepository" ADD CONSTRAINT "GithubRepository_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
