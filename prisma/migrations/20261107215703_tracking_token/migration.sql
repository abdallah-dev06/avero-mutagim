-- AlterTable
ALTER TABLE "Order" DROP COLUMN "accessTokenHash",
ADD COLUMN     "accessToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");

