import type { ParsedTransaction, UploadJob } from "@/features/upload-screenshots/model/types";

export function attachDraftsToUploadJob(
  jobs: UploadJob[],
  jobId: string,
  drafts: ParsedTransaction[],
) {
  return jobs.map((job) => (job.id === jobId ? { ...job, drafts } : job));
}

export function appendDraftToUploadJob(
  jobs: UploadJob[],
  jobId: string,
  draft: ParsedTransaction,
) {
  return jobs.map((job) =>
    job.id === jobId ? { ...job, drafts: [...job.drafts, draft] } : job,
  );
}

export function updateUploadJobDraft(
  jobs: UploadJob[],
  jobId: string,
  localId: string,
  patch: Partial<ParsedTransaction>,
) {
  return jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          drafts: job.drafts.map((draft) =>
            draft.localId === localId ? { ...draft, ...patch } : draft,
          ),
        }
      : job,
  );
}

export function removeDraftFromUploadJob(
  jobs: UploadJob[],
  jobId: string,
  localId: string,
) {
  return jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          drafts: job.drafts.filter((draft) => draft.localId !== localId),
        }
      : job,
  );
}

export function removeUploadJob(jobs: UploadJob[], jobId: string) {
  return jobs.filter((job) => job.id !== jobId);
}

export function getDoneUploadJobs(jobs: UploadJob[]) {
  return jobs.filter((job) => job.status === "done");
}

export function getNextDoneUploadJob(jobs: UploadJob[], currentJobId?: string) {
  const doneJobs = getDoneUploadJobs(jobs);
  if (!currentJobId) return doneJobs[0];

  const currentIndex = doneJobs.findIndex((job) => job.id === currentJobId);
  return doneJobs[currentIndex + 1];
}

export function getPreviousDoneUploadJob(jobs: UploadJob[], currentJobId: string) {
  const doneJobs = getDoneUploadJobs(jobs);
  const currentIndex = doneJobs.findIndex((job) => job.id === currentJobId);
  return currentIndex > 0 ? doneJobs[currentIndex - 1] : undefined;
}

export function isLastDoneUploadJob(jobs: UploadJob[], currentJobId: string) {
  const doneJobs = getDoneUploadJobs(jobs);
  return doneJobs.length > 0 && doneJobs[doneJobs.length - 1].id === currentJobId;
}
