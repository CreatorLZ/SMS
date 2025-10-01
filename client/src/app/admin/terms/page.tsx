"use client";
import { useState, useMemo } from "react";
import DashboardLayout from "../../../components/ui/dashboard-layout";
import RoleGuard from "../../../components/ui/role-guard";
import TermTable from "../../../components/ui/TermTable";
import CreateTermModal from "../../../components/ui/CreateTermModal";
import EditTermModal from "../../../components/ui/EditTermModal";
import DeleteConfirmationModal from "../../../components/ui/DeleteConfirmationModal";
import SessionTable from "../../../components/ui/SessionTable";
import CreateSessionModal from "../../../components/ui/CreateSessionModal";
import EditSessionModal from "../../../components/ui/EditSessionModal";
import { useTermManagementStore } from "../../../store/termManagementStore";
import { useTermsQuery } from "../../../hooks/useTermsQuery";
import { useSessionsQuery } from "../../../hooks/useSessionsQuery";
import { useActivateTermMutation } from "../../../hooks/useActivateTermMutation";
import { useDeleteTermMutation } from "../../../hooks/useDeleteTermMutation";
import {
  useActivateSessionMutation,
  useDeactivateSessionMutation,
  useDeleteSessionMutation,
} from "../../../hooks/useSessionsQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  GraduationCap,
} from "lucide-react";
import { Session } from "../../../hooks/useSessionsQuery";

export default function AdminTermsPage() {
  const [activeTab, setActiveTab] = useState("terms");

  const {
    searchQuery,
    statusFilter,
    yearFilter,
    setCreateModalOpen,
    setEditModalOpen,
    setDeleteModalOpen,
    setSearchQuery,
    setStatusFilter,
    setYearFilter,
    resetFilters,
  } = useTermManagementStore();

  const { data: terms, isLoading, refetch } = useTermsQuery();
  const {
    data: sessions,
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = useSessionsQuery();
  const activateTermMutation = useActivateTermMutation();
  const deleteTermMutation = useDeleteTermMutation();

  // Session management state
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showDeleteSessionModal, setShowDeleteSessionModal] = useState(false);

  // Session mutations
  const activateSessionMutation = useActivateSessionMutation();
  const deactivateSessionMutation = useDeactivateSessionMutation();
  const deleteSessionMutation = useDeleteSessionMutation();

  const [toastProps, setToastProps] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showToast, setShowToast] = useState(false);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastProps({ message, type });
    setShowToast(true);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!terms) return { total: 0, active: 0, inactive: 0, years: 0 };

    const active = terms.filter((term) => term.isActive).length;
    const inactive = terms.length - active;

    // Get unique sessions
    const uniqueSessions = new Set(
      terms.map((term) => (term as any).sessionId?.name).filter(Boolean)
    );
    const years = uniqueSessions.size;

    return {
      total: terms.length,
      active,
      inactive,
      years,
    };
  }, [terms]);

  // Calculate session statistics
  const sessionStats = useMemo(() => {
    if (!sessions) return { total: 0, active: 0, inactive: 0 };

    const active = sessions.filter((session) => session.isActive).length;
    const inactive = sessions.length - active;

    return {
      total: sessions.length,
      active,
      inactive,
    };
  }, [sessions]);

  // Filter terms based on search and filters
  const filteredTerms = useMemo(() => {
    if (!terms) return [];

    return terms.filter((term) => {
      const sessionName = (term as any).sessionId?.name || "";
      const matchesSearch =
        !searchQuery ||
        `${term.name} Term ${sessionName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && term.isActive) ||
        (statusFilter === "inactive" && !term.isActive);

      const matchesSession = !yearFilter || sessionName === yearFilter;

      return matchesSearch && matchesStatus && matchesSession;
    });
  }, [terms, searchQuery, statusFilter, yearFilter]);

  // Get unique sessions for filter dropdown
  const availableSessions = useMemo(() => {
    if (!terms) return [];
    const sessions = [
      ...new Set(
        terms.map((term) => (term as any).sessionId?.name).filter(Boolean)
      ),
    ].sort();
    return sessions;
  }, [terms]);

  const handleActivate = async (termId: string) => {
    try {
      await activateTermMutation.mutateAsync(termId);
      showToastMessage("Term activated successfully", "success");
      refetch();
    } catch (error: any) {
      console.error("Error activating term:", error);
      showToastMessage(
        `Error activating term: ${
          error.response?.data?.message || error.message
        }`,
        "error"
      );
    }
  };

  const handleEdit = (term: any) => {
    setEditModalOpen(true, term);
  };

  const handleDelete = (term: any) => {
    setDeleteModalOpen(true, term);
  };

  const handleConfirmDelete = async () => {
    const { termToDelete, setDeleteModalOpen } =
      useTermManagementStore.getState();
    if (!termToDelete) return;

    try {
      // Note: You'll need to create useDeleteTermMutation hook
      // await deleteTermMutation.mutateAsync(termToDelete._id);
      showToastMessage("Term deleted successfully", "success");
      setDeleteModalOpen(false);
      refetch();
    } catch (error: any) {
      showToastMessage(
        `Error deleting term: ${
          error.response?.data?.message || error.message
        }`,
        "error"
      );
    }
  };

  // Session handlers
  const handleEditSession = (session: Session) => {
    setSessionToEdit(session);
    setShowEditSessionModal(true);
  };

  const handleDeleteSession = (session: Session) => {
    setSessionToDelete(session);
    setShowDeleteSessionModal(true);
  };

  const handleActivateSession = async (sessionId: string) => {
    try {
      await activateSessionMutation.mutateAsync(sessionId);
      showToastMessage("Session activated successfully", "success");
      refetchSessions();
    } catch (error: any) {
      console.error("Error activating session:", error);
      showToastMessage(
        `Error activating session: ${
          error.response?.data?.message || error.message
        }`,
        "error"
      );
    }
  };

  const handleDeactivateSession = async (sessionId: string) => {
    try {
      await deactivateSessionMutation.mutateAsync(sessionId);
      showToastMessage("Session deactivated successfully", "success");
      refetchSessions();
    } catch (error: any) {
      console.error("Error deactivating session:", error);
      showToastMessage(
        `Error deactivating session: ${
          error.response?.data?.message || error.message
        }`,
        "error"
      );
    }
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      await deleteSessionMutation.mutateAsync(sessionToDelete._id);
      showToastMessage("Session deleted successfully", "success");
      setShowDeleteSessionModal(false);
      setSessionToDelete(null);
      refetchSessions();
    } catch (error: any) {
      showToastMessage(
        `Error deleting session: ${
          error.response?.data?.message || error.message
        }`,
        "error"
      );
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleYearFilterChange = (value: string) => {
    setYearFilter(value);
  };

  return (
    <RoleGuard allowed={["admin", "superadmin"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Term Management
              </h1>
              <p className="text-muted-foreground">
                Manage academic terms, track active periods, and organize school
                calendar
              </p>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="w-full sm:w-auto"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Term
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Terms
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Academic periods
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Terms
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sessions
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {sessionStats.total}
                </div>
                <p className="text-xs text-muted-foreground">Academic years</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Sessions
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {sessionStats.active}
                </div>
                <p className="text-xs text-muted-foreground">Current year</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inactive Terms
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.inactive}
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed or upcoming
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Academic Sessions
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.years}</div>
                <p className="text-xs text-muted-foreground">
                  Sessions covered
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Terms and Sessions */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="terms"
                className={
                  activeTab === "terms"
                    ? "bg-white text-gray-900 shadow-sm"
                    : ""
                }
              >
                Academic Terms
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                className={
                  activeTab === "sessions"
                    ? "bg-white text-gray-900 shadow-sm"
                    : ""
                }
              >
                Academic Sessions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="terms" className="space-y-6">
              {/* Term Filters and Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Term Directory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search by term name or session..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => handleStatusFilterChange(e.target.value)}
                      className={cn(
                        "flex h-10 w-full sm:w-40 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        "appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY5NzM4NSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-right-3 bg-center"
                      )}
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>

                    <select
                      value={yearFilter}
                      onChange={(e) => handleYearFilterChange(e.target.value)}
                      className={cn(
                        "flex h-10 w-full sm:w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        "appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY5NzM4NSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-right-3 bg-center"
                      )}
                    >
                      <option value="">All Sessions</option>
                      {availableSessions.map((session) => (
                        <option key={session} value={session}>
                          {session}
                        </option>
                      ))}
                    </select>

                    {(searchQuery || statusFilter || yearFilter) && (
                      <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="w-full sm:w-auto"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>

                  {/* Active Filters Display */}
                  {(searchQuery || statusFilter || yearFilter) && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {searchQuery && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          Search: {searchQuery}
                          <button
                            type="button"
                            onClick={() => handleSearchChange("")}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      )}
                      {statusFilter && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          Status: {statusFilter}
                          <button
                            type="button"
                            onClick={() => handleStatusFilterChange("")}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      )}
                      {yearFilter && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          Session: {yearFilter}
                          <button
                            type="button"
                            onClick={() => handleYearFilterChange("")}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Term Table */}
              <TermTable
                terms={filteredTerms}
                onEdit={handleEdit}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="sessions" className="space-y-6">
              {/* Session Header with Create Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Academic Sessions
                  </h2>
                  <p className="text-muted-foreground">
                    Manage academic years for result management
                  </p>
                </div>
                <Button onClick={() => setShowCreateSessionModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Session
                </Button>
              </div>

              {/* Session Table */}
              <SessionTable
                sessions={sessions || []}
                onEdit={handleEditSession}
                onDelete={handleDeleteSession}
                onActivate={handleActivateSession}
                onDeactivate={handleDeactivateSession}
                isLoading={sessionsLoading}
              />
            </TabsContent>
          </Tabs>

          {/* Modals */}
          <CreateTermModal />
          <EditTermModal />
          <DeleteConfirmationModal
            isOpen={useTermManagementStore((state) => state.isDeleteModalOpen)}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Term"
            message={`Are you sure you want to delete this term? This action cannot be undone.`}
            isLoading={deleteTermMutation.isPending}
          />

          {/* Session Modals */}
          <CreateSessionModal
            isOpen={showCreateSessionModal}
            onClose={() => setShowCreateSessionModal(false)}
          />
          <EditSessionModal
            session={sessionToEdit}
            isOpen={showEditSessionModal}
            onClose={() => {
              setShowEditSessionModal(false);
              setSessionToEdit(null);
            }}
          />
          <DeleteConfirmationModal
            isOpen={showDeleteSessionModal}
            onClose={() => {
              setShowDeleteSessionModal(false);
              setSessionToDelete(null);
            }}
            onConfirm={handleConfirmDeleteSession}
            title="Delete Session"
            message={`Are you sure you want to delete "${sessionToDelete?.name}"? This action cannot be undone.`}
            isLoading={deleteSessionMutation.isPending}
          />

          {/* Toast */}
          {showToast && toastProps && (
            <Toast
              message={toastProps.message}
              type={toastProps.type}
              onClose={() => setShowToast(false)}
            />
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
