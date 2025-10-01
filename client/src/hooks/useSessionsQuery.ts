import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export interface Session {
  _id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionData {
  name: string;
  startYear: number;
  endYear: number;
  isActive?: boolean;
}

export interface UpdateSessionData {
  name?: string;
  startYear?: number;
  endYear?: number;
  isActive?: boolean;
}

export const useSessionsQuery = () => {
  return useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: async (): Promise<Session[]> => {
      const response = await api.get("/admin/sessions");
      return (response.data as { data: Session[] }).data;
    },
  });
};

export const useActiveSessionQuery = () => {
  return useQuery<Session | null>({
    queryKey: ["active-session"],
    queryFn: async (): Promise<Session | null> => {
      const response = await api.get("/admin/sessions");
      const sessions = (response.data as { data: Session[] }).data;
      return sessions.find((session: Session) => session.isActive) || null;
    },
  });
};

export const useCreateSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSessionData): Promise<Session> => {
      const response = await api.post("/admin/sessions", data);
      return (response.data as { data: Session }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["active-session"] });
    },
  });
};

export const useUpdateSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSessionData;
    }): Promise<Session> => {
      const response = await api.put(`/admin/sessions/${id}`, data);
      return (response.data as { data: Session }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["active-session"] });
    },
  });
};

export const useActivateSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Session> => {
      const response = await api.patch(`/admin/sessions/${id}/activate`);
      return (response.data as { data: Session }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["active-session"] });
    },
  });
};

export const useDeactivateSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Session> => {
      const response = await api.patch(`/admin/sessions/${id}/deactivate`);
      return (response.data as { data: Session }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["active-session"] });
    },
  });
};

export const useDeleteSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/admin/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["active-session"] });
    },
  });
};
