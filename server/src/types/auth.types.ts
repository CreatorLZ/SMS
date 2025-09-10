import { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  _id: string;
  password: string;
  role: "superadmin" | "admin" | "teacher" | "student" | "parent";
  verified: boolean;
  refreshTokens: string[];
  linkedStudentIds?: string[];
  assignedClassId?: string;
  subjectSpecializations?: string[];
  subjectSpecialization?: string; // Keep for backward compatibility
  status: "active" | "inactive";
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface JwtPayload {
  id: string;
  role: string;
  email: string;
}

export interface TokenPayload {
  accessToken: string;
  refreshToken: string;
}

export type Permission =
  // User Management
  | "users.create"
  | "users.read"
  | "users.update"
  | "users.delete"
  | "users.manage_admins"
  | "users.manage_superadmins"

  // Student Management
  | "students.create"
  | "students.read"
  | "students.update"
  | "students.delete"

  // Teacher Management
  | "teachers.create"
  | "teachers.read"
  | "teachers.update"
  | "teachers.delete"

  // Classroom Management
  | "classrooms.create"
  | "classrooms.read"
  | "classrooms.update"
  | "classrooms.delete"
  | "classrooms.assign_students"
  | "classrooms.assign_subjects"

  // Subject Management
  | "subjects.create"
  | "subjects.read"
  | "subjects.update"
  | "subjects.delete"

  // Term Management
  | "terms.create"
  | "terms.read"
  | "terms.update"
  | "terms.delete"
  | "terms.activate"

  // Attendance
  | "attendance.create"
  | "attendance.read"
  | "attendance.update"
  | "attendance.delete"

  // Reports & Analytics
  | "reports.read"
  | "reports.export"

  // Audit Logs
  | "audit.read"

  // Timetable Management
  | "timetables.create"
  | "timetables.read"
  | "timetables.update"
  | "timetables.delete"

  // System Configuration
  | "system.configure";

export interface RolePermissions {
  [key: string]: Permission[];
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      permissions?: Permission[];
    }
  }
}
