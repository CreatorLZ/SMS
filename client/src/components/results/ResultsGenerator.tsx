import React, { useState } from "react";
import { FileText } from "lucide-react";
import { useTeacherClassroomsQuery } from "../../hooks/useTeacherClassroomsQuery";
import { useTermsQuery } from "../../hooks/useTermsQuery";
import { useSessionsQuery } from "../../hooks/useSessionsQuery";
import { useResultsManagementStore } from "../../store/resultsManagementStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormData {
  class: string;
  session: string;
  term: string;
}

const ResultsGenerator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    class: "",
    session: "",
    term: "",
  });

  const { data: classrooms, isLoading: classroomsLoading } =
    useTeacherClassroomsQuery();
  const { data: terms, isLoading: termsLoading } = useTermsQuery();
  const { data: sessions, isLoading: sessionsLoading } = useSessionsQuery();
  const { setSelectedClass, setSelectedSession, setSelectedTerm } =
    useResultsManagementStore();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateResults = () => {
    if (!formData.class || !formData.session || !formData.term) {
      alert("Please fill in all fields");
      return;
    }

    // Debug logging
    console.log(
      "ResultsGenerator - formData.class:",
      formData.class,
      typeof formData.class
    );
    console.log(
      "ResultsGenerator - Available classrooms:",
      classrooms?.map((c) => ({ id: c._id, name: c.name }))
    );

    // Validate that the selected class exists in the classrooms list
    const selectedClassroom = classrooms?.find((c) => c._id === formData.class);
    if (!selectedClassroom) {
      console.error(
        "Selected class not found in classrooms list:",
        formData.class
      );
      alert(
        "Selected class is not valid. Please select a class from the list."
      );
      return;
    }

    // Set the selections in the store
    setSelectedClass(formData.class);
    setSelectedSession(formData.session);
    setSelectedTerm(formData.term);

    // The parent component will detect the store changes and switch to management mode
    console.log("Generating results for:", formData);
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Card className="rounded-lg shadow-sm py-4 px-2">
        <CardHeader className="text-center space-y-1 pb-2">
          <div className="mx-auto w-8 h-8 bg-primary rounded flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <CardTitle className="text-base">Generate Results</CardTitle>
          {/* <CardDescription className="text-xs">
        Select class, session, and term
          </CardDescription> */}
        </CardHeader>

        <CardContent className="space-y-2 px-2 pb-2">
          {/* Class Selection */}
          <div>
            <Label htmlFor="class" className="text-xs">
              Class
            </Label>
            <Select
              value={formData.class}
              onValueChange={(value) => handleInputChange("class", value)}
              disabled={classroomsLoading}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue
                  placeholder={
                    classroomsLoading ? "Loading..." : "Select Class"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {classrooms?.map((classroom) => (
                  <SelectItem
                    key={classroom._id}
                    value={classroom._id}
                    className="text-xs"
                  >
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session Selection */}
          <div>
            <Label htmlFor="session" className="text-xs">
              Session
            </Label>
            <Select
              value={formData.session}
              onValueChange={(value) => handleInputChange("session", value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue
                  placeholder={
                    sessionsLoading ? "Loading..." : "Select Session"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {sessions?.map((session) => (
                  <SelectItem
                    key={session._id}
                    value={session.name}
                    className="text-xs"
                  >
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Term Selection */}
          <div>
            <Label htmlFor="term" className="text-xs">
              Term
            </Label>
            <Select
              value={formData.term}
              onValueChange={(value) => handleInputChange("term", value)}
              disabled={termsLoading}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue
                  placeholder={termsLoading ? "Loading..." : "Select Term"}
                />
              </SelectTrigger>
              <SelectContent>
                {terms?.map((term) => (
                  <SelectItem
                    key={term._id}
                    value={term.name}
                    className="text-xs"
                  >
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateResults}
            className="w-full h-8 text-xs"
            size="sm"
          >
            Generate
          </Button>
        </CardContent>
      </Card>

      {/* Selected Info Display */}
      {(formData.class || formData.session || formData.term) && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Current Selection:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {formData.class && (
                  <Badge variant="secondary">
                    {classrooms?.find((c) => c._id === formData.class)?.name ||
                      formData.class}
                  </Badge>
                )}
                {formData.session && (
                  <Badge variant="secondary">{formData.session}</Badge>
                )}
                {formData.term && (
                  <Badge variant="secondary">{formData.term} Term</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResultsGenerator;
