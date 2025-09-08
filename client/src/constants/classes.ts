export const STUDENT_CLASSES = [
  // Primary School
  { label: "Primary 1", value: "Primary 1" },
  { label: "Primary 2", value: "Primary 2" },
  { label: "Primary 3", value: "Primary 3" },
  { label: "Primary 4", value: "Primary 4" },
  { label: "Primary 5", value: "Primary 5" },
  { label: "Primary 6", value: "Primary 6" },
  // Junior Secondary School
  { label: "JSS1", value: "JSS1" },
  { label: "JSS2", value: "JSS2" },
  { label: "JSS3", value: "JSS3" },
  // Senior Secondary School
  { label: "SS1", value: "SS1" },
  { label: "SS2", value: "SS2" },
  { label: "SS3", value: "SS3" },
];

export const STUDENT_CLASS_VALUES = STUDENT_CLASSES.map((c) => c.value);

export const isValidStudentClass = (classValue: string): boolean => {
  return STUDENT_CLASS_VALUES.includes(classValue);
};

export const getStudentClassLabel = (classValue: string): string => {
  const classOption = STUDENT_CLASSES.find((c) => c.value === classValue);
  return classOption ? classOption.label : classValue;
};
