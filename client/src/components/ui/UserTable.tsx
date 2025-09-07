import { useUsersQuery, User } from "@/hooks/useUsersQuery";

export default function UserTable() {
  const { data: users, isLoading, error } = useUsersQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading users.</div>;
  if (!users || users.length === 0) return <div>No users found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: User) => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>Active</td>
              <td>{new Date(user.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
