import { useState } from "react";
import { useCreateUserMutation } from "@/hooks/useCreateUserMutation";
import { useUserManagementStore } from "@/store/userManagementStore";
import { toast } from "sonner";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Separator } from "./separator";
import {
  User,
  Mail,
  Lock,
  Shield,
  BookOpen,
  Users as UsersIcon,
  X,
  Terminal,
  Database,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function CreateUserModal() {
  const { isCreateModalOpen, setCreateModalOpen } = useUserManagementStore();
  const createUserMutation = useCreateUserMutation();
  const [activeTab, setActiveTab] = useState("USER");
  const [currentTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour12: false })
  );

  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "parent",
    phone: "",
    linkedStudentIds: [] as string[],
  });

  const showToastMessage = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const getSecurityLevel = (role: string) => {
    switch (role) {
      case "superadmin":
        return "LEVEL-10";
      case "admin":
        return "LEVEL-7";
      case "teacher":
        return "LEVEL-5";
      case "parent":
        return "LEVEL-3";
      case "student":
        return "LEVEL-2";
      default:
        return "LEVEL-1";
    }
  };

  const getDisplayRole = (role: string) => {
    return role?.toUpperCase() || "UNKNOWN";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Type-safe object construction based on role
      const baseData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
      };

      let submitData: typeof baseData & Record<string, any>;

      switch (formData.role) {
        case "parent":
          submitData = {
            ...baseData,
            linkedStudentIds: formData.linkedStudentIds,
          };
          break;
        default:
          submitData = baseData;
      }

      await createUserMutation.mutateAsync(submitData);
      showToastMessage("User created successfully", "success");
      setCreateModalOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "parent",
        phone: "",
        linkedStudentIds: [],
      });
    } catch (error: any) {
      showToastMessage(
        error?.response?.data?.message || "Failed to create user",
        "error"
      );
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData({
      ...formData,
      role,
      // Reset role-specific fields when role changes
      phone: "",
      linkedStudentIds: [],
    });
  };

  if (!isCreateModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      {/* Retro CRT scanlines effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(75, 85, 99, 0.1) 2px,
            rgba(75, 85, 99, 0.1) 4px
          )`,
        }}
      />

      {/* Main Terminal Container */}
      <div className="w-full max-w-6xl max-h-[95vh] bg-white border-4 border-gray-600 font-mono text-gray-800 shadow-2xl relative overflow-hidden">
        {/* Terminal Header */}
        <div className="border-b-2 border-gray-600 p-2 md:p-4 bg-gray-100/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                <span className="text-xs md:text-sm font-bold">
                  MY SCHOOL INTERNATIONAL SCHOOLS
                </span>
              </div>
              <div className="text-xs">USER CREATION SYSTEM v0.0.1</div>
            </div>
            <div className="flex items-center gap-2 md:gap-6 text-xs">
              <span>TIME: {currentTime}</span>
              <span>USER: {getDisplayRole(user?.role || "")}</span>
              <span>SECURITY: {getSecurityLevel(user?.role || "")}</span>
            </div>
          </div>
        </div>

        {/* Sub Header */}
        <div className="border-b border-gray-600 p-2 md:p-3 bg-gray-100/10 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
            <span>[CREATING NEW USER ACCOUNT...]</span>
            <span>CONNECTION: SECURE | MODE: CREATE</span>
          </div>
        </div>

        <div className="flex flex-col h-[calc(95vh-120px)]">
          {/* Tab Navigation */}
          <div className="border-b border-gray-600 p-2 md:p-4 bg-gray-100/10">
            <div className="flex gap-2 text-xs">
              {["USER", "ROLE-SPECIFIC"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 md:px-4 py-2 border border-gray-600 transition-all duration-200 text-xs md:text-sm ${
                    activeTab === tab
                      ? "bg-gray-600 text-white font-bold"
                      : "bg-gray-50 hover:bg-gray-100/20"
                  }`}
                >
                  {tab === "ROLE-SPECIFIC" ? `${tab} INFO` : `${tab} INFO`}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "USER" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      USER ACCOUNT CREATION
                    </div>
                    <div className="text-xs">ENTER BASIC USER DATA BELOW</div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    {/* Full Name and Email */}
                    <div className="flex flex-col md:flex-row border-b border-gray-600/20 py-2">
                      <div className="w-full md:w-48 font-bold mb-1 md:mb-0">
                        FULL NAME:
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter user's full name"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row border-b border-gray-600/20 py-2">
                      <div className="w-full md:w-48 font-bold mb-1 md:mb-0">
                        EMAIL ADDRESS:
                      </div>
                      <div className="flex-1">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex border-b border-gray-600/20 py-2">
                      <div className="w-48 font-bold">PASSWORD:</div>
                      <div className="flex-1">
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter password"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex border-b border-gray-600/20 py-2">
                      <div className="w-48 font-bold">PHONE NUMBER:</div>
                      <div className="flex-1">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div className="flex border-b border-gray-600/20 py-2">
                      <div className="w-48 font-bold">USER ROLE:</div>
                      <div className="flex-1">
                        <select
                          value={formData.role}
                          onChange={(e) => handleRoleChange(e.target.value)}
                          className="w-full bg-white border border-gray-600/30 px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-600"
                          required
                        >
                          <option value="" className="bg-white text-gray-800">
                            Select user role
                          </option>
                          <option
                            value="parent"
                            className="bg-white text-gray-800"
                          >
                            Parent
                          </option>
                          <option
                            value="admin"
                            className="bg-white text-gray-800"
                          >
                            Admin
                          </option>
                          <option
                            value="superadmin"
                            className="bg-white text-gray-800"
                          >
                            Super Admin
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "ROLE-SPECIFIC" && (
                <div>
                  <div className="border-b border-gray-600 mb-4 pb-2">
                    <div className="text-sm font-bold">
                      ROLE-SPECIFIC INFORMATION
                    </div>
                    <div className="text-xs">
                      ENTER ROLE-SPECIFIC DATA BELOW
                    </div>
                  </div>

                  {formData.role === "parent" && (
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">
                          LINKED STUDENT IDS:
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.linkedStudentIds.join(", ")}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                linkedStudentIds: e.target.value
                                  .split(",")
                                  .map((id) => id.trim())
                                  .filter((id) => id),
                              })
                            }
                            className="w-full bg-transparent border border-gray-600/30 px-2 py-1 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600"
                            placeholder="Comma-separated student IDs (optional)"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.role === "admin" && (
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">
                          ADMIN ACCESS LEVEL:
                        </div>
                        <div className="flex-1">
                          <span className="text-green-600 font-bold">
                            FULL SYSTEM ACCESS
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.role === "superadmin" && (
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex border-b border-gray-600/20 py-2">
                        <div className="w-48 font-bold">
                          SUPER ADMIN ACCESS:
                        </div>
                        <div className="flex-1">
                          <span className="text-red-600 font-bold animate-pulse">
                            UNLIMITED SYSTEM ACCESS
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Command Bar */}
          <div className="border-t-2 border-gray-600 p-3 md:p-4 bg-gray-100/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-xs">
                [CREATION SESSION ACTIVE] | [MODE: USER-CREATE] | [STATUS:
                READY]
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2 border border-gray-600 bg-gray-50 hover:bg-gray-600 hover:text-white transition-colors text-xs font-bold disabled:opacity-50"
                >
                  {createUserMutation.isPending
                    ? "[CREATING...]"
                    : "[CREATE USER]"}
                </button>

                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-red-500 bg-gray-50 hover:bg-red-500 transition-colors text-xs font-bold"
                >
                  [CANCEL]
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
