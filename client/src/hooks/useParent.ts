import { useParentStore } from "../store/parentStore";
import api from "../lib/api";

// Fetch parent, then fetch each linked student
export function useFetchChildren() {
  const setChildren = useParentStore((s) => s.setChildren);
  return async () => {
    const res = await api.get("/parent/dashboard");
    const data = res.data as { linkedStudentIds: string[] };
    const linkedStudentIds = data.linkedStudentIds || [];
    const students = await Promise.all(
      linkedStudentIds.map((id: string) =>
        api
          .get("/student/profile", { params: { studentId: id } })
          .then((r) => r.data)
      )
    );
    setChildren(students as any);
    return students as any;
  };
}
