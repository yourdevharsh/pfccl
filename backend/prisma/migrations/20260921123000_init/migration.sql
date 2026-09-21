-- CreateTable
CREATE TABLE "RepositoryMeta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RepositoryMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Division" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "incorporationDate" DATE NOT NULL,
    "divisionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyDetail" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "detailKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "detailKey" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "physicalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/octet-stream',
    "size" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_divisionId_incorporationDate_idx" ON "Company"("divisionId", "incorporationDate");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyDetail_companyId_detailKey_key" ON "CompanyDetail"("companyId", "detailKey");

-- CreateIndex
CREATE INDEX "CompanyDetail_detailKey_idx" ON "CompanyDetail"("detailKey");

-- CreateIndex
CREATE INDEX "StoredFile_companyId_detailKey_idx" ON "StoredFile"("companyId", "detailKey");

-- CreateIndex
CREATE INDEX "StoredFile_companyId_detailKey_fieldPath_idx" ON "StoredFile"("companyId", "detailKey", "fieldPath");

-- CreateIndex
CREATE INDEX "StoredFile_companyId_detailKey_id_idx" ON "StoredFile"("companyId", "detailKey", "id");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDetail" ADD CONSTRAINT "CompanyDetail_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
