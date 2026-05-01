import { request } from "./client";

export interface Student {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profilePicture?: string;
}

export interface Skill {
  id: string;
  name: string;
  level?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
}

export interface Vouch {
  id: string;
  message: string;
}

export const studentsAPI = {
  getAll: async (): Promise<Student[]> => {
    const res = await request("/students");
    return res.students ?? res ?? [];
  },

  getById: async (id: string): Promise<Student> => {
    const res = await request(`/students/${id}`);
    return res.student ?? res;
  },

  updateMe: async (data: Partial<Student>): Promise<Student> => {
    const res = await request("/students/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.student ?? res;
  },

  deleteMe: async (): Promise<void> => {
    await request("/students/me", { method: "DELETE" });
  },

  getMySkills: async (): Promise<Skill[]> => {
    const res = await request("/students/me/skills");
    return res.skills ?? res ?? [];
  },

  addSkill: async (data: { name: string; level?: string }): Promise<Skill> => {
    const res = await request("/students/me/skills", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.skill ?? res;
  },

  updateSkill: async (skillId: string, data: Partial<Skill>): Promise<Skill> => {
    const res = await request(`/students/me/skills/${skillId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.skill ?? res;
  },

  deleteSkill: async (skillId: string): Promise<void> => {
    await request(`/students/me/skills/${skillId}`, {
      method: "DELETE",
    });
  },

  getReviews: async (studentId: string): Promise<Review[]> => {
    const res = await request(`/students/${studentId}/reviews`);
    return res.reviews ?? res ?? [];
  },

  getVouches: async (studentId: string): Promise<Vouch[]> => {
    const res = await request(`/students/${studentId}/vouches`);
    return res.vouches ?? res ?? [];
  },
};