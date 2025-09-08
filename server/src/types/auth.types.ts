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
  subjectSpecialization?: string;
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

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
