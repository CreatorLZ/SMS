import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ResultsDashboard from "@/components/results/ResultsDashboard";

export default function ResultsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Results Management
          </h1>
          <p className="text-muted-foreground">
            Generate, edit, and publish student results for your school
          </p>
        </div>
      </div>

      {/* Results Dashboard */}
      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Loading Results Dashboard...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        }
      >
        <ResultsDashboard />
      </Suspense>
    </div>
  );
}
