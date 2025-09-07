// Sample data script for onboarding/testing
export const sampleStudents = [
  {
    _id: "1",
    fullName: "Ayo Balogun",
    studentId: "STU001",
    currentClass: "JSS1",
    termFees: [
      { term: "1st", year: 2025, paid: true, pinCode: "1234", viewable: true },
      {
        term: "2nd",
        year: 2025,
        paid: false,
        pinCode: "5678",
        viewable: false,
      },
    ],
    attendance: [
      { date: "2025-01-10", status: "present" },
      { date: "2025-01-11", status: "absent" },
    ],
    results: [
      {
        term: "1st",
        year: 2025,
        scores: [
          { subject: "Math", score: 85 },
          { subject: "English", score: 90 },
        ],
        comment: "Great job!",
        updatedBy: "teacher1",
        updatedAt: "2025-01-15T10:00:00Z",
      },
    ],
  },
];

export const sampleParents = [
  {
    _id: "P1",
    name: "Mrs. Balogun",
    email: "parent1@example.com",
    linkedStudentIds: ["STU001"],
  },
];
