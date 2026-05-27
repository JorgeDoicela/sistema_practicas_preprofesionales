-- CreateTable
CREATE TABLE "LopdpLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LopdpLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LopdpLog_userId_idx" ON "LopdpLog"("userId");

-- CreateIndex
CREATE INDEX "LopdpLog_acceptedAt_idx" ON "LopdpLog"("acceptedAt");

-- AddForeignKey
ALTER TABLE "LopdpLog" ADD CONSTRAINT "LopdpLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
