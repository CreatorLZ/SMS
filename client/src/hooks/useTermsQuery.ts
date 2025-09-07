import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Term {
  _id: string;
  name: "1st" | "2nd" | "3rd";
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  holidays: {
    name: string;
    startDate: string;
    endDate: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export const useTermsQuery = () => {
  return useQuery<Term[]>({
    queryKey: ["terms"],
    queryFn: async (): Promise<Term[]> => {
      const response = await api.get("/admin/terms");
      return response.data as Term[];
    },
  });
};
