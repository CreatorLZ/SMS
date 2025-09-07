"use client";
import { useState } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import StudentTable from "../../../components/ui/StudentTable";
import CreateStudentModal from "../../../components/ui/CreateStudentModal";
import EditStudentModal from "../../../components/ui/EditStudentModal";
import { useStudentManagementStore } from "../../../store/studentManagementStore";
import { useStudentsQuery } from "../../../hooks/useStudentsQuery";
import { useClassroomsQuery } from "../../../hooks/useClassroomsQuery";

export default function AdminStudentsPage() {
  const {
    searchQuery,
    classFilter,
    currentPage,
    setCreateModalOpen,
    setSearchQuery,
    setClassFilter,
    setCurrentPage,
  } = useStudentManagementStore();

  const { data: studentsResponse } = useStudentsQuery(
    searchQuery,
    classFilter,
    currentPage
  );
  const { data: classrooms } = useClassroomsQuery();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClassFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClassFilter(e.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-4">Student Management</h1>

        {/* Controls */}
        <div className="mb-4 flex gap-4 items-center">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Add Student
          </button>

          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="min-w-48">
            <select
              value={classFilter}
              onChange={handleClassFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="">All Classes</option>
              {classrooms?.map((classroom) => (
                <option key={classroom._id} value={classroom.name}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Table */}
        <StudentTable />

        {/* Pagination */}
        {studentsResponse?.pagination && (
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>

            {Array.from(
              { length: studentsResponse.pagination.pages },
              (_, i) => i + 1
            ).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 border rounded ${
                  page === currentPage ? "bg-blue-500 text-white" : ""
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= studentsResponse.pagination.pages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Modals */}
        <CreateStudentModal />
        <EditStudentModal />
      </DashboardLayout>
    </RoleGuard>
  );
}
