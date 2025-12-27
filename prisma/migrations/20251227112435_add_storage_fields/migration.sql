-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "storageLimitBytes" BIGINT,
ADD COLUMN     "storageUsedBytes" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "storageLimitBytes" BIGINT,
ADD COLUMN     "storageUsedBytes" BIGINT NOT NULL DEFAULT 0;
