interface Message {
  _id: string;
  sender: string;
  content: string;
  createdAt: string;
}

export default function MessageList({ messages }: { messages: Message[] }) {
  if (!messages.length) return <div>No messages yet.</div>;
  return (
    <ul className="space-y-2">
      {messages.map((m) => (
        <li key={m._id} className="bg-gray-100 rounded p-2">
          <div className="font-semibold text-xs text-gray-500">
            {m.sender}{" "}
            <span className="float-right">
              {new Date(m.createdAt).toLocaleString()}
            </span>
          </div>
          <div>{m.content}</div>
        </li>
      ))}
    </ul>
  );
}
