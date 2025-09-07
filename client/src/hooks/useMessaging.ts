import api from "../lib/api";

interface Message {
  _id: string;
  sender: string;
  content: string;
  createdAt: string;
}

export function useSendMessage() {
  return async (recipientIds: string[], message: string) => {
    const res = await api.post("/messages", { recipientIds, message });
    return res.data as Message;
  };
}

export function useFetchMessages() {
  return async () => {
    const res = await api.get("/messages");
    const data = res.data as { messages: Message[] };
    return (data.messages || []) as Message[];
  };
}
