-- CreateTable
CREATE TABLE "public"."solana_blocks" (
    "id" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "transactionCount" INTEGER NOT NULL,
    "blockhash" TEXT NOT NULL,
    "timestamp" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solana_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solana_blocks_blockNumber_key" ON "public"."solana_blocks"("blockNumber");
