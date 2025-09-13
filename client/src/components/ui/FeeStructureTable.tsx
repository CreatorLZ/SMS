import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { useFeeStore } from "../../store/feeStore";
import { useFeeStructures } from "../../hooks/useFeeStructures";
import { useEnqueueFeeSync } from "../../hooks/useFeeSync";
import SyncStatusWidget from "./SyncStatusWidget";
import { Plus, RefreshCw, Edit, Trash2 } from "lucide-react";

interface FeeStructureTableProps {
  onCreateClick?: () => void;
  onEditClick?: (structure: any) => void;
}

export default function FeeStructureTable({
  onCreateClick,
  onEditClick,
}: FeeStructureTableProps) {
  const { feeStructures, isLoadingFeeStructures, feeStructuresError } =
    useFeeStore();

  const { refetchFeeStructures } = useFeeStructures();
  const syncMutation = useEnqueueFeeSync();

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync({});
      alert("Fee synchronization started successfully!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to start sync");
    }
  };

  const handleDelete = async (structure: any) => {
    if (
      window.confirm(
        `Delete fee structure for ${structure.classroomId.name} - ${structure.termId.name} ${structure.termId.year}?`
      )
    ) {
      try {
        await useFeeStructures().confirmDeleteFeeStructure({
          id: structure._id,
          confirm: true,
        });
        alert("Fee structure deleted successfully!");
        refetchFeeStructures();
      } catch (error: any) {
        alert(
          error.response?.data?.message || "Failed to delete fee structure"
        );
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  if (feeStructuresError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load fee structures</p>
            <Button
              variant="outline"
              onClick={() => refetchFeeStructures()}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fee Structures</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage fee amounts for each classroom and term
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${
                  syncMutation.isPending ? "animate-spin" : ""
                }`}
              />
              Sync Fees
            </Button>
            <Button onClick={onCreateClick}>
              <Plus className="w-4 h-4 mr-2" />
              Create Fee Structure
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingFeeStructures ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : feeStructures.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No fee structures found</p>
            <Button onClick={onCreateClick} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create First Fee Structure
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Classroom</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeStructures.map((structure) => (
                  <TableRow key={structure._id}>
                    <TableCell className="font-medium">
                      {structure.classroomId.name}
                    </TableCell>
                    <TableCell>
                      {structure.termId.name} {structure.termId.year}
                    </TableCell>
                    <TableCell>{formatCurrency(structure.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClick?.(structure)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(structure)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
