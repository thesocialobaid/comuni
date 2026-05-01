import {request} from "./client";

export interface Job {
  id: string;
  title: string;
  description: string;
  location?: string;
}

export const jobsAPI = {
  getAll: async (): Promise<Job[]> => {
    const res = await request("/jobs");
    return res.jobs; // 👈 IMPORTANT FIX
  },

  getById: async (id: string): Promise<Job> => {
    const res = await request(`/jobs/${id}`);
    return res.job ?? res; // supports both shapes
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
    await request(`/jobs/${id}`, {
      method: "DELETE",
    });
  },
};