-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('INVITED', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "hiring_pipelines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_assessments" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "order" INTEGER NOT NULL,
    "timeLimit" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "questionsBank" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_candidates" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" "CandidateStatus" NOT NULL DEFAULT 'INVITED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_results" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "answers" JSONB NOT NULL,
    "timeSpent" INTEGER,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hiring_pipelines_token_key" ON "hiring_pipelines"("token");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_candidates_pipelineId_email_key" ON "pipeline_candidates"("pipelineId", "email");

-- AddForeignKey
ALTER TABLE "hiring_pipelines" ADD CONSTRAINT "hiring_pipelines_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_pipelines" ADD CONSTRAINT "hiring_pipelines_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_assessments" ADD CONSTRAINT "pipeline_assessments_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "hiring_pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_candidates" ADD CONSTRAINT "pipeline_candidates_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "hiring_pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_results" ADD CONSTRAINT "pipeline_results_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "hiring_pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_results" ADD CONSTRAINT "pipeline_results_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "pipeline_candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_results" ADD CONSTRAINT "pipeline_results_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "pipeline_assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
