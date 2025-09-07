import { useClassroomsQuery, Classroom } from "@/hooks/useClassroomsQuery";
import { useClassroomManagementStore } from "@/store/classroomManagementStore";

export default function ClassroomTable() {
  const { data: classrooms, isLoading, error } = useClassroomsQuery();
  const { setAssignModalOpen } = useClassroomManagementStore();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading classrooms.</div>;
  if (!classrooms || classrooms.length === 0)
    return <div>No classrooms found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Classroom Name</th>
            <th>Assigned Teacher</th>
            <th>Number of Students</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {classrooms.map((classroom: Classroom) => (
            <tr key={classroom._id}>
              <td>{classroom.name}</td>
              <td>
                {classroom.teacherId.name} ({classroom.teacherId.email})
              </td>
              <td>{classroom.students.length}</td>
              <td>{new Date(classroom.createdAt).toLocaleString()}</td>
              <td>
                <button
                  onClick={() => setAssignModalOpen(true, classroom._id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Manage Students
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
