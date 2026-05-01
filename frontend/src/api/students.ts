import {request} from "./client";

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
  //  GET ALL STUDENTS
  getAll: (): Promise<Student[]> =>
    request("/students"),

  //  GET SINGLE STUDENT
  getById: (id: string): Promise<Student> =>
    request(`/students/${id}`),

  //  UPDATE MY PROFILE
  updateMe: (data: Partial<Student>): Promise<Student> =>
    request("/students/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  //  DELETE MY PROFILE
  deleteMe: (): Promise<void> =>
    request("/students/me", {
      method: "DELETE",
    }),

  //  SKILLS (MY PROFILE)

  getMySkills: (): Promise<Skill[]> =>
    request("/students/me/skills"),

  addSkill: (data: { name: string; level?: string }): Promise<Skill> =>
    request("/students/me/skills", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSkill: (
    skillId: string,
    data: Partial<Skill>
  ): Promise<Skill> =>
    request(`/students/me/skills/${skillId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteSkill: (skillId: string): Promise<void> =>
    request(`/students/me/skills/${skillId}`, {
      method: "DELETE",
    }),

  //  REVIEWS

  getReviews: (studentId: string): Promise<Review[]> =>
    request(`/students/${studentId}/reviews`),

  //  VOUCHES

  getVouches: (studentId: string): Promise<Vouch[]> =>
    request(`/students/${studentId}/vouches`),
};