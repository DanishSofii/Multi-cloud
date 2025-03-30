/*
  Warnings:

  - Added the required column `authId` to the `FilePartitioning` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `filepartitioning` ADD COLUMN `authId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `FilePartitioning` ADD CONSTRAINT `FilePartitioning_authId_fkey` FOREIGN KEY (`authId`) REFERENCES `CloudAuth`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
