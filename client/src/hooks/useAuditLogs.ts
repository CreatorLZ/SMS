import api from "../lib/api";

export function useFetchAuditLogs() {
  return async () => {
    const res = await api.get("/admin/logs");
    return res.data;
  };
}
