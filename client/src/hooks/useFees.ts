import api from "../lib/api";

export function useFetchFeeStatus() {
  return async () => {
    const res = await api.get("/fees/status");
    return res.data;
  };
}
