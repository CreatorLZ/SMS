"use client";
import { useState, useMemo } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { useSubjectsQuery } from "../../../hooks/useSubjectsQuery";
import {
  useUpdateSubjectMutation,
  useDeactivateSubjectMutation,
  useActivateSubjectMutation,
} from "../../../hooks/useUpdateSubjectMutation";
import { useToast } from "../../../components/ui/use-toast";

export default function AdminSubjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { toast } = useToast();

  // API queries and mutations
  const {
    data: subjects = [],
    isLoading,
    error,
  } = useSubjectsQuery({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    level: levelFilter === "all" ? undefined : levelFilter,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
    search: searchTerm || undefined,
  });

  const updateSubjectMutation = useUpdateSubjectMutation();
  const deactivateSubjectMutation = useDeactivateSubjectMutation();
  const activateSubjectMutation = useActivateSubjectMutation();

  // Handler functions
  const handleToggleSubjectStatus = async (
    subjectId: string,
    isActive: boolean
  ) => {
    try {
      if (isActive) {
        await deactivateSubjectMutation.mutateAsync(subjectId);
        toast({
          title: "Success",
          description: "Subject deactivated successfully",
        });
      } else {
        await activateSubjectMutation.mutateAsync(subjectId);
        toast({
          title: "Success",
          description: "Subject activated successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update subject status",
        variant: "destructive",
      });
    }
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const matchesSearch = subject.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || subject.category === categoryFilter;
      const matchesLevel =
        levelFilter === "all" || subject.level === levelFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && subject.isActive) ||
        (statusFilter === "inactive" && !subject.isActive);

      return matchesSearch && matchesCategory && matchesLevel && matchesStatus;
    });
  }, [subjects, searchTerm, categoryFilter, levelFilter, statusFilter]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Core":
        return "bg-blue-100 text-blue-800";
      case "Science":
        return "bg-green-100 text-green-800";
      case "Humanities":
        return "bg-purple-100 text-purple-800";
      case "Business":
        return "bg-orange-100 text-orange-800";
      case "Trade":
        return "bg-yellow-100 text-yellow-800";
      case "Optional":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Primary":
        return "bg-emerald-100 text-emerald-800";
      case "Junior Secondary":
        return "bg-indigo-100 text-indigo-800";
      case "Senior Secondary":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <RoleGuard allowed={["admin", "superadmin"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading subjects...</p>
            </div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard allowed={["admin", "superadmin"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 mb-4">Failed to load subjects</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Subject Management
              </h1>
              <p className="text-muted-foreground">
                Manage subjects and curriculum offerings
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Subjects
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subjects.length}</div>
                <p className="text-xs text-muted-foreground">Active subjects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Core Subjects
                </CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {subjects.filter((s) => s.category === "Core").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Mandatory subjects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Science Subjects
                </CardTitle>
                <BookOpen className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {subjects.filter((s) => s.category === "Science").length}
                </div>
                <p className="text-xs text-muted-foreground">STEM subjects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Trade Subjects
                </CardTitle>
                <BookOpen className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {subjects.filter((s) => s.category === "Trade").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Vocational subjects
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subjects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Core">Core</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Humanities">Humanities</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Trade">Trade</SelectItem>
                    <SelectItem value="Optional">Optional</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Primary">Primary</SelectItem>
                    <SelectItem value="Junior Secondary">
                      Junior Secondary
                    </SelectItem>
                    <SelectItem value="Senior Secondary">
                      Senior Secondary
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setLevelFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subjects Table */}
          <Card>
            <CardHeader>
              <CardTitle>Subjects ({filteredSubjects.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSubjects.map((subject) => (
                  <div
                    key={subject._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {subject.name}
                        </h3>
                        <Badge className={getCategoryColor(subject.category)}>
                          {subject.category}
                        </Badge>
                        <Badge className={getLevelColor(subject.level)}>
                          {subject.level}
                        </Badge>
                        <Badge
                          variant={subject.isActive ? "default" : "secondary"}
                        >
                          {subject.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created:{" "}
                        {new Date(subject.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleSubjectStatus(
                            subject._id,
                            subject.isActive
                          )
                        }
                        disabled={
                          deactivateSubjectMutation.isPending ||
                          activateSubjectMutation.isPending
                        }
                        className={
                          subject.isActive
                            ? "text-orange-600 hover:text-orange-700"
                            : "text-green-600 hover:text-green-700"
                        }
                      >
                        {deactivateSubjectMutation.isPending ||
                        activateSubjectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : subject.isActive ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredSubjects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No subjects found matching your criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
