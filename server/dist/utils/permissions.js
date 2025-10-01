"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolePermissions = void 0;
exports.getRolePermissions = getRolePermissions;
exports.hasPermission = hasPermission;
exports.hasAnyPermission = hasAnyPermission;
exports.hasAllPermissions = hasAllPermissions;
// Define permissions for each role
exports.rolePermissions = {
    superadmin: [
        // User Management - Full access
        "users.create",
        "users.read",
        "users.update",
        "users.delete",
        "users.manage_admins",
        "users.manage_superadmins",
        // Student Management - Full access
        "students.create",
        "students.read",
        "students.update",
        "students.delete",
        // Teacher Management - Full access
        "teachers.create",
        "teachers.read",
        "teachers.update",
        "teachers.delete",
        // Classroom Management - Full access
        "classrooms.create",
        "classrooms.read",
        "classrooms.update",
        "classrooms.delete",
        "classrooms.assign_students",
        "classrooms.assign_subjects",
        // Subject Management - Full access
        "subjects.create",
        "subjects.read",
        "subjects.update",
        "subjects.delete",
        // Term Management - Full access
        "terms.create",
        "terms.read",
        "terms.update",
        "terms.delete",
        "terms.activate",
        // Attendance - Full access
        "attendance.create",
        "attendance.read",
        "attendance.update",
        "attendance.delete",
        // Reports & Analytics - Full access
        "reports.read",
        "reports.export",
        // Audit Logs - Full access
        "audit.read",
        // Timetable Management - Full access
        "timetables.create",
        "timetables.read",
        "timetables.update",
        "timetables.delete",
        // System Configuration - Full access
        "system.configure",
        // Fee Management - Full access
        "fees.create",
        "fees.read",
        "fees.update",
        "fees.delete",
        "fees.sync",
        "fees.pay",
    ],
    admin: [
        // User Management - Can manage non-admin users
        "users.create",
        "users.read",
        "users.update",
        "users.delete",
        // Student Management - Full access
        "students.create",
        "students.read",
        "students.update",
        "students.delete",
        // Teacher Management - Full access
        "teachers.create",
        "teachers.read",
        "teachers.update",
        "teachers.delete",
        // Classroom Management - Full access
        "classrooms.create",
        "classrooms.read",
        "classrooms.update",
        "classrooms.delete",
        "classrooms.assign_students",
        "classrooms.assign_subjects",
        // Subject Management - Full access
        "subjects.create",
        "subjects.read",
        "subjects.update",
        "subjects.delete",
        // Term Management - Full access
        "terms.create",
        "terms.read",
        "terms.update",
        "terms.delete",
        "terms.activate",
        // Attendance - Full access
        "attendance.create",
        "attendance.read",
        "attendance.update",
        "attendance.delete",
        // Reports & Analytics - Full access
        "reports.read",
        "reports.export",
        // Audit Logs - Full access
        "audit.read",
        // Timetable Management - Full access
        "timetables.create",
        "timetables.read",
        "timetables.update",
        "timetables.delete",
        // Fee Management - Full access
        "fees.create",
        "fees.read",
        "fees.update",
        "fees.delete",
        "fees.sync",
        "fees.pay",
        // System Configuration - Limited
        // Note: Admin cannot configure system settings
    ],
    teacher: [
        // User Management - Read only for assigned students
        "users.read",
        // Student Management - Read only for assigned students
        "students.read",
        // Teacher Management - Read only
        "teachers.read",
        // Classroom Management - Read only for assigned classrooms
        "classrooms.read",
        // Term Management - Read only
        "terms.read",
        // Attendance - Can create and update for assigned classes
        "attendance.create",
        "attendance.read",
        "attendance.update",
        // Timetable Management - Can create, read, and update for assigned classes
        "timetables.create",
        "timetables.read",
        "timetables.update",
        // Reports - Limited to own classes
        "reports.read",
    ],
    student: [
        // User Management - Read own profile
        "users.read",
        // Student Management - Read own data
        "students.read",
        // Classroom Management - Read assigned classroom
        "classrooms.read",
        // Term Management - Read only
        "terms.read",
        // Attendance - Read own attendance
        "attendance.read",
        // Reports - Read own reports
        "reports.read",
    ],
    parent: [
        // User Management - Read own profile and linked students
        "users.read",
        // Student Management - Read linked students' data
        "students.read",
        // Classroom Management - Read linked students' classrooms
        "classrooms.read",
        // Term Management - Read only
        "terms.read",
        // Attendance - Read linked students' attendance
        "attendance.read",
        // Reports - Read linked students' reports
        "reports.read",
    ],
};
/**
 * Get permissions for a specific role
 */
function getRolePermissions(role) {
    return exports.rolePermissions[role] || [];
}
/**
 * Check if a role has a specific permission
 */
function hasPermission(role, permission) {
    const permissions = getRolePermissions(role);
    return permissions.includes(permission);
}
/**
 * Check if a role has any of the specified permissions
 */
function hasAnyPermission(role, permissions) {
    const rolePermissions = getRolePermissions(role);
    return permissions.some((permission) => rolePermissions.includes(permission));
}
/**
 * Check if a role has all of the specified permissions
 */
function hasAllPermissions(role, permissions) {
    const rolePermissions = getRolePermissions(role);
    return permissions.every((permission) => rolePermissions.includes(permission));
}
