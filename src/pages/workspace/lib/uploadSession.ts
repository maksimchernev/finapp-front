export function resetUploadSession({
  clearReviewDrafts,
  clearReviewError,
  clearUploadError,
  resetUploadJobs,
}: {
  clearReviewDrafts: () => void;
  clearReviewError: () => void;
  clearUploadError: () => void;
  resetUploadJobs: () => void;
}) {
  clearReviewDrafts();
  clearReviewError();
  clearUploadError();
  resetUploadJobs();
}
