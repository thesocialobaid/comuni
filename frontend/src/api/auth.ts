    import {request} from "./client";

    export interface User {
    id: string;
    name: string;
    email: string;
    }

    export interface LoginResponse {
    token: string;
    user: User;
    }

    export const authAPI = {
    login: async (data: { email: string; password: string }): Promise<LoginResponse> => {
        const res = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        });

        // 🔥 STORE TOKEN HERE (important)
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));

        return res;
    },

    register: async (data: {
        name: string;
        email: string;
        password: string;
        rollNumber: string;
    }): Promise<LoginResponse> => {
        const res = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
        });

        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));

        return res;
    },

    me: (): Promise<User> => request("/auth/me"),

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },

    getUser: (): User | null => {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    },
    };