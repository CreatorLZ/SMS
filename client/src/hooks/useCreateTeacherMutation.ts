import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface CreateTeacherData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  subjectSpecializations?: string[];
  subjectSpecialization?: string; // Keep for backward compatibility
  assignedClassId?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  stateOfOrigin?: string;
  localGovernmentArea?: string;
  address?: string;
  alternativePhone?: string;
  personalEmail?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
  };
  qualification?: string;
  yearsOfExperience?: number;
  previousSchool?: string;
  employmentStartDate?: string;
  teachingLicenseNumber?: string;
  employmentType?: string;
  maritalStatus?: string;
  nationalIdNumber?: string;
  bankInformation?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  bloodGroup?: string;
  knownAllergies?: string;
  medicalConditions?: string;
}

export const useCreateTeacherMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teacherData: CreateTeacherData) => {
      const response = await api.post("/admin/teachers", teacherData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });
};
