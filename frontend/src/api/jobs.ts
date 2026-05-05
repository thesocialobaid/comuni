import { request } from "./client";

export interface Job {
  id: string;
  title: string;
  description: string;
  location?: string;
}

export interface JobReview {
  reviewId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string;
  reviewerId: number;
  revieweeName: string;
  revieweeId: number;
}

export const jobsAPI = {
  getAll: async (): Promise<Job[]> => {
    const res = await request("/jobs");
    return res.jobs;
  },

  getById: async (id: string): Promise<Job> => {
    const res = await request(`/jobs/${id}`);
    return res.job ?? res;
  },

  create: async (data: Partial<Job>): Promise<Job> => {
    const res = await request("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.job ?? res;
  },

  update: async (id: string, data: Partial<Job>): Promise<Job> => {
    const res = await request(`/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.job ?? res;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/jobs/${id}`, { method: "DELETE" });
  },

  // ── Reviews ──────────────────────────────────────────────────────────────

  /**
   * GET /api/jobs/:jobId/reviews
   * Returns all reviews submitted for this job.
   */
  getReviews: async (jobId: string): Promise<JobReview[]> => {
    const res = await request(`/jobs/${jobId}/reviews`);
    return res.reviews ?? [];
  },

  /**
   * POST /api/jobs/:jobId/reviews
   * Body: { rating: 1-5, comment?: string }
   *
   * Can only be called after the job status is COMPLETED.
   * The backend auto-determines reviewer/reviewee from the authenticated user.
   * Returns 409 if the user already reviewed this job.
   */
  submitReview: async (
    jobId: string,
    data: { rating: number; comment?: string }
  ): Promise<{ reviewId: number }> => {
    const res = await request(`/jobs/${jobId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res;
  },
};