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

export const useActiveTermQuery = () => {
  return useQuery<Term | null>({
    queryKey: ["active-term"],
    queryFn: async (): Promise<Term | null> => {
      try {
        const response = await api.get("/admin/terms");
        const terms: Term[] = response.data as Term[];
        return terms.find((term) => term.isActive) || null;
      } catch (error) {
        console.error("Error fetching active term:", error);
        return null;
      }
    },
  });
};
