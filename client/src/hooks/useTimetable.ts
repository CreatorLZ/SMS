import { useTimetableStore } from "../store/timetableStore";
import api from "../lib/api";

// Fetch classroom and extract timetable
export function useFetchTimetable(classId: string) {
  const setTimetable = useTimetableStore((s) => s.setTimetable);
  return async () => {
    const res = await api.get(`/admin/classrooms`); // get all classrooms
    const classroom = Array.isArray(res.data)
      ? res.data.find((c: any) => c._id === classId)
      : null;
    const timetable = classroom?.timetable || [];
    setTimetable(timetable);
    return timetable;
  };
}
