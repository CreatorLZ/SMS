import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Skeleton } from "./skeleton";
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Database,
  Loader2,
} from "lucide-react";
import api from "../../lib/api";
import { useToast } from "./use-toast";

interface HealthReport {
  timestamp: string;
  summary: {
    totalStudents: number;
    studentsWithMissingFees: number;
    studentsWithExtraFees: number;
    totalFeeDiscrepancies: number;
  };
  details: {
    missingFees: any[];
    extraFees: any[];
    classroomStats: any[];
  };
  healthStatus: {
    status: string;
    message: string;
  };
}

export default function ReconcilePage() {
  const { toast } = useToast();
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reconciliation action states
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isFullReconciliation, setIsFullReconciliation] = useState(false);

  const runHealthCheck = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/fees/health-check");
      setHealthReport(response.data as HealthReport);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to run health check");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="destructive">Critical</Badge>;
    }
  };

  // Reconciliation action functions
  const runDeduplication = async () => {
    setIsDeduplicating(true);
    setError(null);
    try {
      const response = await api.post("/admin/fees/reconcile/deduplicate");
      const data = response.data as any;
      toast({
        title: "✅ Deduplication Complete",
        description: `Removed ${data.stats.duplicatesFound} duplicates`,
      });
      // Run health check automatically after reconciliation
      await runHealthCheck();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Deduplication failed";
      setError(errorMessage);
      toast({
        title: "❌ Deduplication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeduplicating(false);
    }
  };

  const runBackfill = async () => {
    setIsBackfilling(true);
    setError(null);
    try {
      const response = await api.post("/admin/fees/reconcile/backfill");
      const data = response.data as any;
      toast({
        title: "✅ Backfill Complete",
        description: `Backfilled ${data.stats.feesBackfilled} missing fees`,
      });
      // Run health check automatically after reconciliation
      await runHealthCheck();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Backfill failed";
      setError(errorMessage);
      toast({
        title: "❌ Backfill Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsBackfilling(false);
    }
  };

  const runFullReconciliation = async () => {
    setIsFullReconciliation(true);
    setError(null);
    try {
      const response = await api.post("/admin/fees/reconcile/full");
      const data = response.data as any;
      toast({
        title: "✅ Full Reconciliation Complete",
        description: `Removed ${data.stats.deduplication.duplicatesRemoved} duplicates, backfilled ${data.stats.backfill.feesBackfilled} fees`,
      });
      // Run health check automatically after reconciliation
      await runHealthCheck();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Full reconciliation failed";
      setError(errorMessage);
      toast({
        title: "❌ Full Reconciliation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFullReconciliation(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fee Reconciliation</h1>
          <p className="text-muted-foreground">
            Monitor and fix fee system integrity issues
          </p>
        </div>
        <Button onClick={runHealthCheck} disabled={isLoading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          {isLoading ? "Running..." : "Run Health Check"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {healthReport && (
        <>
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(healthReport.healthStatus.status)}
                System Health Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {healthReport.healthStatus.message}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Students:</span>
                      <p className="text-2xl font-bold">
                        {healthReport.summary.totalStudents}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Missing Fees:</span>
                      <p className="text-2xl font-bold text-red-600">
                        {healthReport.summary.studentsWithMissingFees}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Extra Fees:</span>
                      <p className="text-2xl font-bold text-yellow-600">
                        {healthReport.summary.studentsWithExtraFees}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Total Issues:</span>
                      <p className="text-2xl font-bold text-orange-600">
                        {healthReport.summary.totalFeeDiscrepancies}
                      </p>
                    </div>
                  </div>
                </div>
                {getStatusBadge(healthReport.healthStatus.status)}
              </div>
            </CardContent>
          </Card>

          {/* Classroom Statistics */}
          {healthReport.details.classroomStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Classroom Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthReport.details.classroomStats.map(
                    (stat: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium">{stat.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {stat.totalStudents} students,{" "}
                            {stat.studentsWithIssues} with issues
                          </p>
                        </div>
                        {stat.studentsWithIssues > 0 ? (
                          <Badge variant="destructive">
                            {stat.studentsWithIssues} issues
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            OK
                          </Badge>
                        )}
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  disabled={isDeduplicating}
                  onClick={runDeduplication}
                  className="flex items-center gap-2"
                >
                  {isDeduplicating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  {isDeduplicating ? "Running..." : "Run Deduplication"}
                </Button>
                <Button
                  variant="outline"
                  disabled={isBackfilling}
                  onClick={runBackfill}
                  className="flex items-center gap-2"
                >
                  {isBackfilling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isBackfilling ? "Running..." : "Backfill Missing Fees"}
                </Button>
                <Button
                  variant="outline"
                  disabled={isFullReconciliation}
                  onClick={runFullReconciliation}
                  className="flex items-center gap-2"
                >
                  {isFullReconciliation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {isFullReconciliation ? "Running..." : "Full Reconciliation"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                These actions will help fix identified issues. Run health check
                again after completion to verify fixes.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {!healthReport && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Health Report Available
            </h3>
            <p className="text-muted-foreground mb-4">
              Run a health check to analyze the current state of your fee
              system.
            </p>
            <Button onClick={runHealthCheck}>Run Health Check</Button>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
