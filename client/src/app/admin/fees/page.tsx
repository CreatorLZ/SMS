"use client";

import { useState } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, DollarSign, Users, BarChart3 } from "lucide-react";

import FeeStructureTable from "@/components/ui/FeeStructureTable";
import StudentFeeTable from "@/components/ui/StudentFeeTable";
import ArrearsReport from "@/components/ui/ArrearsReport";
import ReconcilePage from "@/components/ui/ReconcilePage";
import CreateFeeStructureModal from "@/components/ui/CreateFeeStructureModal";
import MarkFeePaidModal from "@/components/ui/MarkFeePaidModal";

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState("structures");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedFee, setSelectedFee] = useState<any>(null);

  const handleCreateFeeStructure = () => {
    setCreateModalOpen(true);
  };

  const handleEditFeeStructure = (structure: any) => {
    // TODO: Implement edit functionality
    console.log("Edit structure:", structure);
  };

  const handleMarkFeePaid = (student: any, fee: any) => {
    setSelectedStudent(student);
    setSelectedFee(fee);
    setMarkPaidModalOpen(true);
  };

  const tabs = [
    {
      id: "structures",
      label: "Fee Structures",
      icon: Building,
      description: "Manage fee amounts for each classroom and term",
      content: (
        <FeeStructureTable
          onCreateClick={handleCreateFeeStructure}
          onEditClick={handleEditFeeStructure}
        />
      ),
    },
    {
      id: "students",
      label: "Student Fees",
      icon: Users,
      description: "Manage individual student fee payments",
      content: <StudentFeeTable onMarkPaidClick={handleMarkFeePaid} />,
    },
    {
      id: "arrears",
      label: "Arrears Report",
      icon: BarChart3,
      description: "View students with outstanding fees",
      content: <ArrearsReport />,
    },
    {
      id: "reconcile",
      label: "Reconciliation",
      icon: DollarSign,
      description: "Health checks and data reconciliation",
      content: <ReconcilePage />,
    },
  ];

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Fee Management
              </h1>
              <p className="text-muted-foreground">
                Comprehensive fee management system for your school
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 space-y-4">
              {tabs.map((tab) => {
                if (activeTab !== tab.id) return null;

                return (
                  <div key={tab.id} className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <tab.icon className="w-5 h-5" />
                          {tab.label}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {tab.description}
                        </p>
                      </CardHeader>
                    </Card>

                    <div className="space-y-4">{tab.content}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modals */}
          <CreateFeeStructureModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
          />

          <MarkFeePaidModal
            open={markPaidModalOpen}
            onOpenChange={setMarkPaidModalOpen}
            student={selectedStudent}
            fee={selectedFee}
          />
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
