import React from "react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import {
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  GraduationCap,
  MoreHorizontal,
} from "lucide-react";
import { Session } from "../../hooks/useSessionsQuery";

interface SessionTableProps {
  sessions: Session[];
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
  onActivate: (sessionId: string) => void;
  onDeactivate: (sessionId: string) => void;
  isLoading?: boolean;
}

export default function SessionTable({
  sessions,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  isLoading = false,
}: SessionTableProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
            <p className="text-sm text-muted-foreground">
              Get started by adding your first academic session.
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
                    Session Name
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Academic Year
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
                {sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {session.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {session.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">
                        {session.startYear}/{session.endYear}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={session.isActive ? "default" : "secondary"}
                        className={
                          session.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {session.isActive ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {session.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(session)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant={session.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() =>
                            session.isActive
                              ? onDeactivate(session._id)
                              : onActivate(session._id)
                          }
                        >
                          {session.isActive ? (
                            <XCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          {session.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(session)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
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
        {sessions.map((session) => (
          <Card key={session._id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {session.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {session.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {session.startYear}/{session.endYear}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={session.isActive ? "default" : "secondary"}
                        className={
                          session.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {session.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(session)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant={session.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() =>
                      session.isActive
                        ? onDeactivate(session._id)
                        : onActivate(session._id)
                    }
                    className="w-full"
                  >
                    {session.isActive ? (
                      <XCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    {session.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(session)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                Created {new Date(session.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
