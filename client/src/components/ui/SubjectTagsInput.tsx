import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Input } from "./input";
import { X, Plus, BookOpen } from "lucide-react";

interface SubjectTagsInputProps {
  subjects: string[];
  onChange: (subjects: string[]) => void;
  placeholder?: string;
  maxVisible?: number;
  className?: string;
}

export default function SubjectTagsInput({
  subjects,
  onChange,
  placeholder = "Add a subject...",
  maxVisible = 10,
  className = "",
}: SubjectTagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddSubject = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !subjects.includes(trimmedValue)) {
      onChange([...subjects, trimmedValue]);
      setInputValue("");
      setIsAdding(false);
    }
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    onChange(subjects.filter((subject) => subject !== subjectToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubject();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setInputValue("");
    }
  };

  const startAdding = () => {
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const visibleSubjects = subjects.slice(0, maxVisible);
  const remainingCount = subjects.length - maxVisible;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Display existing subjects */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleSubjects.map((subject, index) => (
            <Badge
              key={index}
              variant="outline"
              className="bg-purple-100 text-purple-800 hover:bg-purple-100 pr-1"
            >
              <BookOpen className="w-3 h-3 mr-1" />
              {subject}
              <button
                type="button"
                onClick={() => handleRemoveSubject(subject)}
                className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-600 hover:bg-purple-50"
            >
              +{remainingCount} more
            </Badge>
          )}
        </div>
      )}

      {/* Add subject input */}
      {isAdding ? (
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAddSubject}
            size="sm"
            disabled={!inputValue.trim()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
          <Button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setInputValue("");
            }}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={startAdding}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Subject
        </Button>
      )}

      {/* Helper text */}
      {subjects.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">
          No subjects added yet. Click "Add Subject" to get started.
        </p>
      )}
    </div>
  );
}
