import { useState } from "react";
import { Term } from "@/hooks/useTermsQuery";
import { useActivateTermMutation } from "@/hooks/useActivateTermMutation";
import { useDeactivateTermMutation } from "@/hooks/useDeactivateTermMutation";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";
import { Edit, CheckCircle, XCircle, Calendar, Clock } from "lucide-react";

interface TermTableProps {
  terms: Term[];
  onEdit: (term: Term) => void;
  isLoading: boolean;
}

export default function TermTable({
  terms,
  onEdit,
  isLoading,
}: TermTableProps) {
  const [processingTerm, setProcessingTerm] = useState<string | null>(null);
  const activateTermMutation = useActivateTermMutation();
  const deactivateTermMutation = useDeactivateTermMutation();

  const handleToggleStatus = async (term: Term) => {
    setProcessingTerm(term._id);
    try {
      if (term.isActive) {
        await deactivateTermMutation.mutateAsync(term._id);
      } else {
        await activateTermMutation.mutateAsync(term._id);
      }
    } finally {
      setProcessingTerm(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!terms || terms.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No terms found</h3>
            <p className="text-sm text-muted-foreground">
              Get started by adding your first academic term.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Term
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Academic Year
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {terms.map((term) => (
                  <tr key={term._id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {term.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {term.name} Term
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {term.holidays.length} holiday
                            {term.holidays.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">
                        {(term as any).sessionId?.name || "Unknown Session"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(term.startDate).toLocaleDateString()} -{" "}
                        {new Date(term.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={term.isActive ? "default" : "secondary"}
                        className={
                          term.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {term.isActive ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {term.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(term.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(term)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant={term.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleStatus(term)}
                          disabled={processingTerm === term._id}
                        >
                          {processingTerm === term._id ? (
                            term.isActive ? (
                              "Deactivating..."
                            ) : (
                              "Activating..."
                            )
                          ) : (
                            <>
                              {term.isActive ? (
                                <XCircle className="w-4 h-4 mr-1" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1" />
                              )}
                              {term.isActive ? "Deactivate" : "Activate"}
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {terms.map((term) => (
          <Card key={term._id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {term.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {term.name} Term
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {(term as any).sessionId?.name || "Unknown Session"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={term.isActive ? "default" : "secondary"}
                        className={
                          term.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {term.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {term.holidays.length} holiday
                        {term.holidays.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(term)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant={term.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleStatus(term)}
                    disabled={processingTerm === term._id}
                    className="w-full"
                  >
                    {processingTerm === term._id ? (
                      term.isActive ? (
                        "Deactivating..."
                      ) : (
                        "Activating..."
                      )
                    ) : (
                      <>
                        {term.isActive ? (
                          <XCircle className="w-4 h-4 mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        {term.isActive ? "Deactivate" : "Activate"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3" />
                  {new Date(term.startDate).toLocaleDateString()} -{" "}
                  {new Date(term.endDate).toLocaleDateString()}
                </div>
                Created {new Date(term.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
