import { useState } from "react";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { useFeeOperation } from "../../hooks/useFeeSync";
import { CheckCircle, Clock, AlertCircle, Loader2, Eye } from "lucide-react";

interface FeeOperation {
  operationId: string;
  status: "enqueued" | "running" | "completed" | "failed";
  classroomId?: { name: string };
  termId?: { name: string; year: number };
  summary?: {
    created: number;
    updated: number;
    attempted: number;
    errors?: any[];
  };
  errors?: any[];
  startedAt?: string;
  finishedAt?: string;
}

interface SyncStatusWidgetProps {
  operationId?: string;
  onViewDetails?: () => void;
}

export default function SyncStatusWidget({
  operationId,
  onViewDetails,
}: SyncStatusWidgetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { data: operation, isLoading, error } = useFeeOperation(operationId);

  if (!operationId) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Not Synced
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (error || !operation) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Error
      </Badge>
    );
  }

  const typedOperation = operation as FeeOperation;

  const getStatusBadge = () => {
    switch (typedOperation.status) {
      case "enqueued":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Queued
          </Badge>
        );
      case "running":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Running
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="default"
            className="flex items-center gap-1 bg-green-100 text-green-800"
          >
            <CheckCircle className="w-3 h-3" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <Eye className="w-3 h-3" />
          </Button>
        </SheetTrigger>
        <SheetContent className="max-w-md">
          <SheetHeader>
            <SheetTitle>Sync Operation Details</SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Operation ID:</span>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {typedOperation.operationId}
                </p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <div className="mt-1">{getStatusBadge()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Classroom:</span>
                <p className="mt-1">
                  {typedOperation.classroomId?.name || "Unknown"}
                </p>
              </div>
              <div>
                <span className="font-medium">Term:</span>
                <p className="mt-1">
                  {typedOperation.termId?.name} {typedOperation.termId?.year}
                </p>
              </div>
            </div>

            {typedOperation.summary && (
              <div className="text-sm">
                <span className="font-medium">Results:</span>
                <div className="mt-2 space-y-1">
                  <p>Created: {typedOperation.summary.created || 0}</p>
                  <p>Updated: {typedOperation.summary.updated || 0}</p>
                  <p>Attempted: {typedOperation.summary.attempted || 0}</p>
                  {typedOperation.summary.errors &&
                    typedOperation.summary.errors.length > 0 && (
                      <p className="text-red-600">
                        Errors: {typedOperation.summary.errors.length}
                      </p>
                    )}
                </div>
              </div>
            )}

            {typedOperation.errors && typedOperation.errors.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-red-600">Errors:</span>
                <div className="mt-2 space-y-1">
                  {typedOperation.errors.map((error: any, index: number) => (
                    <p key={index} className="text-xs text-red-600">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                Started:{" "}
                {typedOperation.startedAt
                  ? new Date(typedOperation.startedAt).toLocaleString()
                  : "N/A"}
              </div>
              <div>
                Finished:{" "}
                {typedOperation.finishedAt
                  ? new Date(typedOperation.finishedAt).toLocaleString()
                  : "N/A"}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
