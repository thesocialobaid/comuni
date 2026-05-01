import {request} from "./client";

export interface Application {
  id: string;
  jobId: string;
  status: "pending" | "accepted" | "rejected";
}

export const applicationAPI = {
  myApplications: (): Promise<Application[]> =>
    request("/applications/mine"),

  applyToJob: (jobId: string): Promise<void> =>
    request(`/jobs/${jobId}/apply`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  deleteApplication: (id: string): Promise<void> =>
    request(`/jobs/applications/${id}`, {
      method: "DELETE",
    }),
};