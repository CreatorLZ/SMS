"use client";
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import api from "../../lib/api";

interface ExcelBulkUploadProps {
  classroomId: string;
  classroomName: string;
  onUploadSuccess?: () => void;
}

export default function ExcelBulkUpload({
  classroomId,
  classroomName,
  onUploadSuccess,
}: ExcelBulkUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Terms options
  const terms = [
    { value: "First Term", label: "First Term" },
    { value: "Second Term", label: "Second Term" },
    { value: "Third Term", label: "Third Term" },
  ];

  const handleDownloadTemplate = async () => {
    if (!classroomId) {
      toast.error("Error", {
        description: "No classroom selected",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const response = await api.get(
        `/admin/results/template?classroomId=${classroomId}`,
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(
        new Blob([response.data as BlobPart])
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `results_template_${classroomName.replace(/\s+/g, "_")}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Success", {
        description: "Excel template downloaded successfully",
      });
    } catch (error: any) {
      console.error("Error downloading template:", error);
      toast.error("Error", {
        description:
          error.response?.data?.message || "Failed to download template",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel.sheet.macroEnabled.12",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid File Type", {
          description: "Please select a valid Excel file (.xlsx or .xls)",
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File Too Large", {
          description: "File size must be less than 10MB",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("No File Selected", {
        description: "Please select an Excel file to upload",
      });
      return;
    }

    if (!selectedTerm || !selectedYear) {
      toast.error("Missing Information", {
        description: "Please select a term and year",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("excelFile", selectedFile);
      formData.append("classroomId", classroomId);
      formData.append("term", selectedTerm);
      formData.append("year", selectedYear.toString());

      const response = await api.post("/admin/results/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Success", {
        description: (response.data as any).message,
      });

      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Notify parent component
      onUploadSuccess?.();
    } catch (error: any) {
      console.error("Error uploading file:", error);

      if (error.response?.data?.errors) {
        // Show validation errors
        const errorMessages = (error.response.data as any).errors;
        toast.error("Validation Errors", {
          description: errorMessages.join(". "),
        });
      } else {
        toast.error("Error", {
          description:
            error.response?.data?.message || "Failed to upload results",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Excel Template Download</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download an Excel template with the correct format for bulk
              uploading student results. The template will include all subjects
              assigned to {classroomName}.
            </p>
            <Button
              onClick={handleDownloadTemplate}
              disabled={isDownloading || !classroomId}
              className="bg-green-600 hover:bg-green-700"
            >
              {isDownloading ? (
                <>
                  <FileSpreadsheet className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Bulk Upload Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Upload Instructions:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Download the template first to ensure correct format</li>
                <li>• Fill in student scores for each subject assessment</li>
                <li>• CA1 and CA2 scores cannot exceed 20 points each</li>
                <li>• Exam scores cannot exceed 60 points</li>
                <li>• Leave cells empty if no score is available</li>
                <li>• Do not modify the header row or student information</li>
              </ul>
            </div>

            {/* Term and Year Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="upload-term">Select Term</Label>
                <select
                  id="upload-term"
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Term</option>
                  {terms.map((term) => (
                    <option key={term.value} value={term.value}>
                      {term.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="upload-year">Academic Year</Label>
                <Input
                  id="upload-year"
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  min={2020}
                  max={2030}
                  required
                />
              </div>
            </div>

            {/* File Selection */}
            <div>
              <Label htmlFor="excel-file">Select Excel File</Label>
              <div className="mt-1 flex items-center space-x-4">
                <Input
                  ref={fileInputRef}
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                {selectedFile && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {selectedFile.name}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum file size: 10MB. Supported formats: .xlsx, .xls
              </p>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={
                isUploading || !selectedFile || !selectedTerm || !selectedYear
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Results
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
