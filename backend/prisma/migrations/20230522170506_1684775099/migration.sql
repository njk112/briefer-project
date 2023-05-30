-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBriefingOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalVideos" INTEGER NOT NULL,
    "videosProccessed" INTEGER NOT NULL DEFAULT 0,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBriefingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubeVideo" (
    "id" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoAuthor" TEXT NOT NULL,
    "timesAccessed" INTEGER NOT NULL DEFAULT 1,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userBriefingOrderId" TEXT NOT NULL,

    CONSTRAINT "YoutubeVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubeAudioLink" (
    "id" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "youtubeVideoId" TEXT NOT NULL,

    CONSTRAINT "YoutubeAudioLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubeTextLink" (
    "id" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "textUrl" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "youtubeVideoId" TEXT NOT NULL,

    CONSTRAINT "YoutubeTextLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubeVideoSummary" (
    "id" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "youtubeVideoId" TEXT NOT NULL,

    CONSTRAINT "YoutubeVideoSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrieferPdfReport" (
    "id" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userBriefingOrderId" TEXT NOT NULL,

    CONSTRAINT "BrieferPdfReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VideoBrieferReports" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeVideo_youtubeId_key" ON "YoutubeVideo"("youtubeId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeAudioLink_audioUrl_key" ON "YoutubeAudioLink"("audioUrl");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeAudioLink_youtubeId_key" ON "YoutubeAudioLink"("youtubeId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeAudioLink_youtubeVideoId_key" ON "YoutubeAudioLink"("youtubeVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeTextLink_youtubeId_key" ON "YoutubeTextLink"("youtubeId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeTextLink_textUrl_key" ON "YoutubeTextLink"("textUrl");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeTextLink_youtubeVideoId_key" ON "YoutubeTextLink"("youtubeVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeVideoSummary_youtubeId_key" ON "YoutubeVideoSummary"("youtubeId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeVideoSummary_youtubeVideoId_key" ON "YoutubeVideoSummary"("youtubeVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "BrieferPdfReport_pdfUrl_key" ON "BrieferPdfReport"("pdfUrl");

-- CreateIndex
CREATE UNIQUE INDEX "BrieferPdfReport_userBriefingOrderId_key" ON "BrieferPdfReport"("userBriefingOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "_VideoBrieferReports_AB_unique" ON "_VideoBrieferReports"("A", "B");

-- CreateIndex
CREATE INDEX "_VideoBrieferReports_B_index" ON "_VideoBrieferReports"("B");

-- AddForeignKey
ALTER TABLE "UserBriefingOrder" ADD CONSTRAINT "UserBriefingOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeVideo" ADD CONSTRAINT "YoutubeVideo_userBriefingOrderId_fkey" FOREIGN KEY ("userBriefingOrderId") REFERENCES "UserBriefingOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeAudioLink" ADD CONSTRAINT "YoutubeAudioLink_youtubeVideoId_fkey" FOREIGN KEY ("youtubeVideoId") REFERENCES "YoutubeVideo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeTextLink" ADD CONSTRAINT "YoutubeTextLink_youtubeVideoId_fkey" FOREIGN KEY ("youtubeVideoId") REFERENCES "YoutubeVideo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeVideoSummary" ADD CONSTRAINT "YoutubeVideoSummary_youtubeVideoId_fkey" FOREIGN KEY ("youtubeVideoId") REFERENCES "YoutubeVideo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrieferPdfReport" ADD CONSTRAINT "BrieferPdfReport_userBriefingOrderId_fkey" FOREIGN KEY ("userBriefingOrderId") REFERENCES "UserBriefingOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VideoBrieferReports" ADD CONSTRAINT "_VideoBrieferReports_A_fkey" FOREIGN KEY ("A") REFERENCES "BrieferPdfReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VideoBrieferReports" ADD CONSTRAINT "_VideoBrieferReports_B_fkey" FOREIGN KEY ("B") REFERENCES "YoutubeVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
