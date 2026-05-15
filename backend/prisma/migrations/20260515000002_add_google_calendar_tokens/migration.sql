-- CreateTable for GoogleCalendarToken
CREATE TABLE "google_calendar_tokens" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "scope" TEXT,
    "tokenType" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_calendar_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_calendar_tokens_doctorId_key" ON "google_calendar_tokens"("doctorId");

-- AddForeignKey
ALTER TABLE "google_calendar_tokens" ADD CONSTRAINT "google_calendar_tokens_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
