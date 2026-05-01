const API = "/api";

export async function request(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(API + url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "API Error");
  }
  return res.json();
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
}

export const api = {
  // JOBS
  getJobs: (): Promise<Job[]> => request("/jobs"),
  getJob: (id: string): Promise<Job> => request(`/jobs/${id}`),
  createJob: (data: Partial<Job>): Promise<Job> =>
    request("/jobs", { method: "POST", body: JSON.stringify(data) }),
  updateJob: (id: string, data: Partial<Job>): Promise<Job> =>
    request(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // STUDENTS
  getMe: (): Promise<Student> => request("/auth/me"),
  updateMe: (data: Partial<Student>): Promise<Student> =>
    request("/students/me", { method: "PATCH", body: JSON.stringify(data) }),

  // APPLICATIONS
  apply: (jobId: string): Promise<void> =>
    request(`/jobs/${jobId}/apply`, { method: "POST", body: JSON.stringify({}) }),
};