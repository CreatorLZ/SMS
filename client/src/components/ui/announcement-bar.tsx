"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/announcements")
      .then((res) => {
        const data = res.data as { announcements?: string[] };
        setAnnouncements(data.announcements || []);
      })
      .catch(() => setError("Could not load announcements."));
  }, []);

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 py-2 px-4 text-center">
        {error}
      </div>
    );
  }
  if (!announcements.length) return null;

  return (
    <div className="bg-blue-100 text-blue-900 py-2 px-4 text-center animate-marquee">
      {announcements.map((a, i) => (
        <span key={i} className="mx-2">
          {a}
        </span>
      ))}
    </div>
  );
}
