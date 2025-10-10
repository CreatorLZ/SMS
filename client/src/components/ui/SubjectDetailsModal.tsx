"use client";
import React, { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { X, Edit, Save, Eye, EyeOff, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  useUpdateSubjectMutation,
  useDeactivateSubjectMutation,
  useActivateSubjectMutation,
} from "../../hooks/useUpdateSubjectMutation";
import { Subject } from "../../hooks/useSubjectsQuery";

interface SubjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
}

export default function SubjectDetailsModal({
  isOpen,
  onClose,
  subject,
}: SubjectDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    level: "",
  });

  const updateSubjectMutation = useUpdateSubjectMutation();
  const deactivateSubjectMutation = useDeactivateSubjectMutation();
  const activateSubjectMutation = useActivateSubjectMutation();

  // Update edit form when subject changes
  React.useEffect(() => {
    if (subject) {
      setEditForm({
        name: subject.name,
        category: subject.category,
        level: subject.level,
      });
    }
  }, [subject]);

  if (!isOpen || !subject) return null;

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

  const handleToggleStatus = async () => {
    try {
      if (subject.isActive) {
        await deactivateSubjectMutation.mutateAsync(subject._id);
        toast.success("Success", {
          description: `Subject "${subject.name}" has been deactivated`,
        });
      } else {
        await activateSubjectMutation.mutateAsync(subject._id);
        toast.success("Success", {
          description: `Subject "${subject.name}" has been activated`,
        });
      }
    } catch (error: any) {
      toast.error("Error", {
        description:
          error.response?.data?.message || "Failed to update subject status",
      });
    }
  };

  const handleSaveChanges = async () => {
    try {
      await updateSubjectMutation.mutateAsync({
        id: subject._id,
        data: {
          name: editForm.name,
          category: editForm.category as any,
          level: editForm.level as any,
        },
      });

      toast.success("Success", {
        description: "Subject details updated successfully",
      });

      setIsEditing(false);
    } catch (error: any) {
      toast.error("Error", {
        description:
          error.response?.data?.message || "Failed to update subject",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: subject.name,
      category: subject.category,
      level: subject.level,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Subject Details</h2>
              <p className="text-sm text-gray-600">{subject.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Status</span>
                <Badge
                  variant={subject.isActive ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  {subject.isActive ? (
                    <>
                      <Eye className="h-3 w-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" />
                      Inactive
                    </>
                  )}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {subject.isActive
                      ? "This subject is currently active and available for assignment."
                      : "This subject is currently inactive and not available for assignment."}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last updated: {new Date(subject.updatedAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={handleToggleStatus}
                  disabled={
                    deactivateSubjectMutation.isPending ||
                    activateSubjectMutation.isPending
                  }
                  className={
                    subject.isActive
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-green-600 hover:bg-green-700"
                  }
                >
                  {deactivateSubjectMutation.isPending ||
                  activateSubjectMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : subject.isActive ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subject Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Subject Information</span>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveChanges}
                      disabled={updateSubjectMutation.isPending}
                    >
                      {updateSubjectMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name
                </label>
                {isEditing ? (
                  <Input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full"
                  />
                ) : (
                  <p className="text-lg font-semibold">{subject.name}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                {isEditing ? (
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Core">Core</option>
                    <option value="Science">Science</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Business">Business</option>
                    <option value="Trade">Trade</option>
                    <option value="Optional">Optional</option>
                  </select>
                ) : (
                  <Badge className={getCategoryColor(subject.category)}>
                    {subject.category}
                  </Badge>
                )}
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                {isEditing ? (
                  <select
                    value={editForm.level}
                    onChange={(e) =>
                      setEditForm({ ...editForm, level: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Primary">Primary</option>
                    <option value="Junior Secondary">Junior Secondary</option>
                    <option value="Senior Secondary">Senior Secondary</option>
                  </select>
                ) : (
                  <Badge className={getLevelColor(subject.level)}>
                    {subject.level}
                  </Badge>
                )}
              </div>

              {/* Timestamps */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Created:</span>
                    <p>{new Date(subject.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>
                    <p>{new Date(subject.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
