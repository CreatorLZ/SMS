import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export interface GradingScale {
  _id: string;
  min: number;
  max: number;
  grade: string;
  remark: string;
}

export function useGradingScales() {
  return useQuery<GradingScale[]>({
    queryKey: ["grading-scales"],
    queryFn: async () => {
      const res = await api.get("/admin/grading-scales");
      const data = res.data as { scales: GradingScale[] };
      return data.scales || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime in v4)
  });
}
