interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  subjectSpecialization?: string;
  assignedClassId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface TeacherTableProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacherId: string) => void;
}

export default function TeacherTable({
  teachers,
  onEdit,
  onDelete,
}: TeacherTableProps) {
  if (!teachers || teachers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No teachers found.</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Subject Specialization</th>
            <th>Assigned Class</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher._id}>
              <td>{teacher.name}</td>
              <td>{teacher.email}</td>
              <td>{teacher.subjectSpecialization || "Not specified"}</td>
              <td>{teacher.assignedClassId?.name || "Not assigned"}</td>
              <td>{new Date(teacher.createdAt).toLocaleString()}</td>
              <td>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(teacher)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(teacher._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
