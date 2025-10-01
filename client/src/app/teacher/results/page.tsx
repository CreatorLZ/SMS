"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/dashboard-layout";
import RoleGuard from "@/components/ui/role-guard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ResultsGenerator from "@/components/results/ResultsGenerator";
import ResultsManagementView from "@/components/results/ResultsManagementView";
import { useResultsManagementStore } from "@/store/resultsManagementStore";

export default function TeacherResultsPage() {
  const [showGenerator, setShowGenerator] = useState(true);
  const {
    selectedClass,
    selectedSession,
    selectedTerm,
    setSelectedClass,
    setSelectedSession,
    setSelectedTerm,
  } = useResultsManagementStore();

  // If selections are made, show the management dashboard
  const hasSelections = selectedClass && selectedSession && selectedTerm;

  // Auto-switch to management mode when selections are complete
  useEffect(() => {
    if (hasSelections && showGenerator) {
      setShowGenerator(false);
    }
  }, [hasSelections, showGenerator]);

  const handleBackToGenerator = () => {
    // Clear selections when going back to generator
    setSelectedClass("");
    setSelectedSession("");
    setSelectedTerm("");
    setShowGenerator(true);
  };

  return (
    <RoleGuard allowed={["teacher"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showGenerator && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToGenerator}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Generator
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {showGenerator ? "Generate Results" : "Results Management"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {showGenerator
                    ? "Select class, session, and term to generate student results"
                    : "Manage academic results for your assigned classes"}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {showGenerator ? (
            <ResultsGenerator />
          ) : (
            <ResultsManagementView onBack={handleBackToGenerator} />
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
