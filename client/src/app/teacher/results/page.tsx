"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/dashboard-layout";
import RoleGuard from "@/components/ui/role-guard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ResultsGenerator from "@/components/results/ResultsGenerator";
import ResultsManagementView from "@/components/results/ResultsManagementView";
import { useResultsManagementStore } from "@/store/resultsManagementStore";

export default function TeacherResultsPage() {
  const [showGenerator, setShowGenerator] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("teacher-results-show-generator");
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
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

  // Save showGenerator to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "teacher-results-show-generator",
      JSON.stringify(showGenerator)
    );
  }, [showGenerator]);

  // Fallback: if showGenerator is false but no selections exist, show generator
  useEffect(() => {
    if (!showGenerator && !hasSelections) {
      setShowGenerator(true);
    }
  }, [showGenerator, hasSelections]);

  const handleBackToGenerator = () => {
    // Clear selections when going back to generator
    setSelectedClass("");
    setSelectedSession("");
    setSelectedTerm("");
    localStorage.removeItem("teacher-results-selections");
    setShowGenerator(true);
  };

  // Load persisted selections on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSelections = localStorage.getItem(
        "teacher-results-selections"
      );
      if (savedSelections) {
        const {
          selectedClass: savedClass,
          selectedSession: savedSession,
          selectedTerm: savedTerm,
        } = JSON.parse(savedSelections);
        if (savedClass) setSelectedClass(savedClass);
        if (savedSession) setSelectedSession(savedSession);
        if (savedTerm) setSelectedTerm(savedTerm);
      }
    }
  }, [setSelectedClass, setSelectedSession, setSelectedTerm]);

  // Save selections to localStorage whenever they change
  useEffect(() => {
    const selections = { selectedClass, selectedSession, selectedTerm };
    localStorage.setItem(
      "teacher-results-selections",
      JSON.stringify(selections)
    );
  }, [selectedClass, selectedSession, selectedTerm]);

  return (
    <RoleGuard allowed={["teacher"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showGenerator && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToGenerator}
                      className="flex items-center"
                      aria-label="Back to Generator"
                    >
                      {/* <span className="sr-only">Back to Generator</span> */}

                      <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back to Generator</TooltipContent>
                </Tooltip>
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
