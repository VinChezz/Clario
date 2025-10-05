ALTER TABLE "File" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "File" ADD COLUMN "permissions" JSONB;
ALTER TABLE "File" ADD COLUMN "shareToken" TEXT;
CREATE UNIQUE INDEX "File_shareToken_key" ON "File"("shareToken");