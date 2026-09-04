-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Command" ADD COLUMN "folderId" TEXT,
ADD COLUMN "language" TEXT NOT NULL DEFAULT 'shell',
ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Folder_userId_updatedAt_idx" ON "Folder"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Command_userId_folderId_idx" ON "Command"("userId", "folderId");

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Command" ADD CONSTRAINT "Command_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
