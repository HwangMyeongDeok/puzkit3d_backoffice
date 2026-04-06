import axiosInstance from "@/lib/axios";
import type { User } from "@/types/types";

export const userApi = {

  getUserById: async (id: string) => {
    const { data } = await axiosInstance.get<User>(`/users/${id}`);
    return data;
  },
};