# School Fee Management System Technical Specification

## Document Information

**Version:** 1.0.0
**Date:** September 2025
**System:** Treasure Land School Management System - Fee Module
**Technology Stack:** Node.js/Express + MongoDB + React/Next.js + TypeScript

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
   1.1 [High-Level Architecture](#11-high-level-architecture)
   1.2 [Data Flow Diagrams](#12-data-flow-diagrams)
   1.3 [Technology Choices](#13-technology-choices)

2. [Database Schema & Models](#2-database-schema--models)
   2.1 [FeeStructure Model](#21-feestructure-model)
   2.2 [Student Model (Fee Integration)](#22-student-model-fee-integration)
   2.3 [FeeSyncLog Model](#23-feesynclog-model)

3. [API Specifications](#3-api-specifications)
   3.1 [Fee Structure Management APIs](#31-fee-structure-management-apis)
   3.2 [Student Fee Management APIs](#32-student-fee-management-apis)
   3.3 [Arrears Reporting APIs](#33-arrears-reporting-apis)
   3.4 [System Synchronization APIs](#34-system-synchronization-apis)
   3.5 [Health Monitoring APIs](#35-health-monitoring-apis)

4. [Core Services & Algorithms](#4-core-services--algorithms)
   4.1 [Fee Synchronization Service](#41-fee-synchronization-service)
   4.2 [PIN Code Generation & Validation](#42-pin-code-generation--validation)
   4.3 [Health Check Reconciliation Algorithm](#43-health-check-reconciliation-algorithm)
   4.4 [Batch Processing Engine](#44-batch-processing-engine)

5. [Frontend Component Architecture](#5-frontend-component-architecture)
   5.1 [Tab-based Navigation System](#51-tab-based-navigation-system)
   5.2 [Fee Structure Management](#52-fee-structure-management)
   5.3 [Student Fee Administration](#53-student-fee-administration)
   5.4 [Arrears Reporting System](#54-arrears-reporting-system)
   5.5 [Reconciliation Dashboard](#55-reconciliation-dashboard)

6. [State Management & Data Fetching](#6-state-management--data-fetching)
   6.1 [Zustand Store Architecture](#61-zustand-store-architecture)
   6.2 [TanStack Query Integration](#62-tanstack-query-integration)
   6.3 [Custom Hooks Structure](#63-custom-hooks-structure)

7. [Synchronization Engine Details](#7-synchronization-engine-details)
   7.1 [Fee Structure Creation Sync](#71-fee-structure-creation-sync)
   7.2 [Student Enrollment Sync](#72-student-enrollment-sync)
   7.3 [Cross-term Consistency Checks](#73-cross-term-consistency-checks)

8. [Performance & Optimization](#8-performance--optimization)
   8.1 [Batching Strategies](#81-batching-strategies)
   8.2 [Indexing Strategy](#82-indexing-strategy)
   8.3 [Caching Implementation](#83-caching-implementation)
   8.4 [Memory Management](#84-memory-management)

9. [Security & Audit Architecture](#9-security--audit-architecture)
   9.1 [PIN Code Security Model](#91-pin-code-security-model)
   9.2 [Audit Trail Implementation](#92-audit-trail-implementation)
   9.3 [Role-based Access Control](#93-role-based-access-control)

10. [Maintenance & Troubleshooting](#10-maintenance--troubleshooting)
    10.1 [Health Check Procedures](#101-health-check-procedures)
    10.2 [Manual Reconciliation Procedures](#102-manual-reconciliation-procedures)
    10.3 [Data Consistency Validation](#103-data-consistency-validation)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

The Fee Management System is a comprehensive module within the Treasure Land School Management System that automates the entire school fee lifecycle from structure definition to payment processing and result access control.

**Core Components:**

- **Fee Structure Engine**: Manages fee amounts per classroom/term
- **Student Fee Integration**: Embeds fee data within student records
- **Synchronization Service**: Automated fee record creation/sync
- **Payment Processing**: Mark fees paid with audit trails
- **Health Monitoring**: System integrity checks and reconciliation
- **Result Gating**: PIN-based access control for student results

**Architecture Principles:**

- **Atomic Operations**: All fee operations maintain data consistency
- **Eventual Consistency**: Batch sync operations for performance
- **Immutable Audit Trails**: Complete financial transaction history
- **Zero-downtime Updates**: Migration-safe schema changes

### 1.2 Data Flow Diagrams

```
/* Data Flow: Fee Structure Creation */
Fee Structure Created
        ↓
Student List Query (classroomId)
        ↓
Batch Fee Entry Creation
        ↓
PIN Code Generation
        ↓
Audit Log Entry
        ↓
UI Update & Confirmation
```

```
/* Data Flow: Fee Payment Processing */
Payment Received
        ↓
Fee Record Locating (term + year)
        ↓
Payment Status Update
        ↓
Result Viewability Set
        ↓
Payment Method Recording
        ↓
Audit Trail Creation
        ↓
Cross-reference Validation
```

### 1.3 Technology Choices

**Backend Technical Stack:**

- Node.js + Express for API server
- MongoDB with Mongoose for data persistence
- TypeScript for type safety
- JWT for authentication
- bcrypt for password hashing
- crypto for PIN generation

**Frontend Technical Stack:**

- React/Next.js for component architecture
- Tailwind CSS for styling
- Zustand for state management
- TanStack Query for data fetching
- shadcn/ui for component library
- TypeScript for type definitions

---

## 2. Database Schema & Models

### 2.1 FeeStructure Model

**File:** `server/src/models/FeeStructure.ts`

**Purpose:** Defines fee amounts for each classroom-term combination

**Schema Structure:**

```typescript
interface IFeeStructure extends Document {
  classroomId: Schema.Types.ObjectId; // Reference to Classroom
  termId: Schema.Types.ObjectId; // Reference to Term
  amount: number; // Fee amount in cents
  isActive: boolean; // Soft delete flag
  deletedAt?: Date;
  deletedBy?: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  updatedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules:**

- Unique constraint on `(classroomId, termId)` - one fee per classroom-term
- `isActive: false` = soft delete (preserves historical data)
- `amount` must be >= 0
- Audited fields track all changes: createdBy, updatedBy, deletedBy

**Indexes:**

- Compound unique index: `{ classroomId: 1, termId: 1 }`
- Single indexes: `{ isActive: 1 }`, `{ createdAt: -1 }`

### 2.2 Student Model (Fee Integration)

**File:** `server/src/models/Student.ts`

**Purpose:** Core student record with embedded fee management

**Term Fees Schema** (Embedded in Student):

```typescript:server/src/models/Student.ts
termFees: [
  {
    term: {
      type: String,
      enum: ["1st", "2nd", "3rd"],
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    paid: {
      type: Boolean,
      default: false
    },
    pinCode: {
      type: String,
      required: true
    },
    viewable: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentDate: Date,
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "online", "check", "mobile_money"]
    },
    receiptNumber: String,
    updatedBy: Schema.Types.ObjectId
  }
]
```

**Business Logic Integration:**

- **PIN Gating**: Results only become `viewable: true` when `paid: true`
- **Auto-Generation**: termFees created automatically on fee structure changes
- **Payment Tracking**: Full payment method and receipt number tracking
- **Audit Integration**: `updatedBy` links to user making payment changes

**Result Access Control:**

```typescript
// Business Rule: Results visible only after payment
const canViewResults = termFee.paid === true;
const pinRequired = termFee.pinCode; // 6-digit code
const resultsAvailable = termFee.viewable === true;
```

### 2.3 FeeSyncLog Model

**File:** `server/src/models/FeeSyncLog.ts`

**Purpose:** Tracks all fee synchronization operations for auditing and debugging

**Schema Structure:**

```typescript
{
  operationId: String,        // Unique operation identifier
  classroomId: ObjectId,      // Classroom being synced
  termId: ObjectId,           // Term being synced (optional)
  enqueuedBy: ObjectId,       // User who initiated sync
  startedAt: Date,           // Operation start time
  finishedAt: Date,          // Operation completion
  summary: Object,           // Stats: { created, updated, errors }
  status: String,            // 'enqueued|running|completed|failed'
  syncErrors: Array,         // Detailed error information
  timestamps: true           // Automatic createdAt/updatedAt
}
```

**Operation Status:**

- `enqueued`: Operation queued for processing
- `running`: Currently executing
- `completed`: Successfully finished with summary stats
- `failed`: Encountered errors with details

**Summary Structure:**

```typescript
{
  syncedStudents: number,    // Students whose fees were updated
  totalFees: number,         // Total fee operations attempted
  errors: number             // Number of failed operations
}
```

---

## 3. API Specifications

### 3.1 Fee Structure Management APIs

#### POST `/admin/fees/structures`

**Purpose:** Create new fee structure

**Request Body:**

```typescript
{
  classroomId: string,    // UUID of classroom
  termId: string,        // UUID of term
  amount: number         // Fee amount in cents
}
```

**Response (201):**

```typescript
{
  feeStructure: FeeStructure,
  message: string,
  syncResult: {
    operationId: string,
    created: number,
    updated: number,
    attempted: number,
    errors: any[]
  }
}
```

**Business Logic:**

- Validates classroom and term exist
- Checks for duplicate (classroom+term)
- Triggers immediate student fee sync
- Creates audit log entry
- Generates FeeSyncLog for tracking

#### GET `/admin/fees/structures`

**Purpose:** Retrieve all fee structures

**Query Parameters:**

```typescript
{
  classroomId?: string,   // Filter by classroom
  termId?: string,       // Filter by term
}
```

**Response (200):**

```typescript
[
  {
    _id: string,
    classroomId: { _id: string, name: string },
    termId: { _id: string, name: string, year: number },
    amount: number,
    createdBy: UserLite,
    updatedBy: UserLite,
    createdAt: Date,
    updatedAt: Date,
  },
];
```

#### PUT `/admin/fees/structures/:id`

**Purpose:** Update fee structure amount

**Request Body:**

```typescript
{
  amount: number; // New fee amount
}
```

**Response (200):**

```typescript
{
  feeStructure: FeeStructure,
  message: string,
  syncResult: SyncResult
}
```

**Business Logic:**

- Triggers student fee amount updates
- Maintains audit trail of old/new amounts
- Sync operation for all affected students

### 3.2 Student Fee Management APIs

#### GET `/admin/fees/students/:studentId/fees`

**Purpose:** Get detailed fee records for student

**Response (200):**

```typescript
{
  _id: string,
  fullName: string,
  studentId: string,
  termFees: [
    {
      term: "1st|2nd|3rd",
      year: number,
      paid: boolean,
      pinCode: string,
      viewable: boolean,
      amount: number,
      paymentDate?: Date,
      paymentMethod?: string,
      receiptNumber?: string
    }
  ]
}
```

**Filtering Logic:**

- Only includes fees that have corresponding FeeStructures
- Filters out orphaned fee records
- Ensures data consistency between models

#### POST `/admin/fees/students/:studentId/pay`

**Purpose:** Mark a specific fee as paid

**Request Body:**

```typescript
{
  term: "1st|2nd|3rd",
  year: number,
  paymentMethod: "cash|bank_transfer|online|check|mobile_money",
  receiptNumber?: string    // Auto-generated if not provided
}
```

**Response (200):**

```typescript
{
  message: string,
  termFee: TermFeeObject,
  receiptNumber: string
}
```

**Critical Business Logic:**

```typescript
// Atomic update operation
termFee.paid = true;
termFee.viewable = true; // Results now accessible
termFee.paymentDate = new Date();
termFee.paymentMethod = paymentMethod;
termFee.receiptNumber = receiptNumber || generateReceipt();
```

### 3.3 Arrears Reporting APIs

#### GET `/admin/fees/arrears`

**Purpose:** Get students with unpaid fees (arrears)

**Query Parameters:**

```typescript
{
  classroomId?: string,    // Filter by classroom
  term?: "1st|2nd|3rd",   // Filter by specific term
  year?: number           // Filter by year
}
```

**Response (200):**

```typescript
[
  {
    _id: string,
    fullName: string,
    studentId: string,
    currentClass: string,
    classroom: string,
    unpaidFees: TermFee[],
    totalUnpaid: number
  }
]
```

**Aggregation Logic:**

- Finds all students with status "active"
- Filters termFees where `paid: false`
- Cross-references with existing FeeStructures
- Calculates totalUnpaid amounts
- Sorts by class name and student name

### 3.4 System Synchronization APIs

#### POST `/admin/fees/sync-all`

**Purpose:** Comprehensive fee sync across all classrooms

**Response (200):**

```typescript
{
  message: string,
  stats: {
    totalStudents: number,
    syncedStudents: number,
    totalFeesProcessed: number,
    totalErrors: number,
    duration: string
  },
  classroomResults: ClassroomSyncResult[],
  studentsWithoutClassroom?: string[]
}
```

**Batch Processing Strategy:**

```typescript
// Process classrooms sequentially to avoid MongoDB load
for (const [classroomId, studentIds] of classroomStudentMap) {
  const result = await syncStudentFeesForClassroomBatched(classroomId, userId);
  // Track detailed per-classroom statistics
  classroomResults.push(result);
}
```

#### POST `/admin/fees/students/:studentId/sync`

**Purpose:** Sync fees for individual student

**Response (200):**

```typescript
{
  message: string,
  student: StudentLite,
  syncResult: SyncResult
}
```

### 3.5 Health Monitoring APIs

#### GET `/admin/fees/health-check`

**Purpose:** Comprehensive system health analysis

**Response (200):**

```typescript
{
  timestamp: Date,
  summary: {
    totalStudents: number,
    studentsWithMissingFees: number,
    studentsWithExtraFees: number,
    totalFeeDiscrepancies: number
  },
  details: {
    missingFees: [
      {
        studentId: string,
        fullName: string,
        classroom: string,
        missingFees: Array<{term, year, expectedAmount}>
      }
    ],
    extraFees: [
      {
        studentId: string,
        fullName: string,
        classroom: string,
        extraFees: Fee[]    // Orphaned fees
      }
    ],
    classroomStats: [
      {
        name: string,
        totalStudents: number,
        studentsWithIssues: number
      }
    ]
  },
  healthStatus: {
    status: "healthy|warning|critical",
    message: string
  }
}
```

**Health Check Algorithm:**

```typescript
// 1. Check all active students
const students = await Student.find({ status: "active" });

// 2. Compare against FeeStructures
for (const student of students) {
  // Check for missing fees that should exist
  // Check for extra fees that shouldn't exist
  // Consider student enrollment dates
}

// 3. Calculate health status
const issuesFound = missingFees + extraFees;
healthStatus = issuesFound === 0 ? "healthy" : "warning";
```

---

## 4. Core Services & Algorithms

### 4.1 Fee Synchronization Service

**File:** `server/src/services/feeSync.service.ts`

**Purpose:** Automated synchronization between FeeStructures and Student termFees

**Core Algorithm:**

```typescript
export async function syncStudentFeesForClassroomBatched(
  classroomId: string,
  userId?: string
): Promise<SyncResult>;
```

**Synchronization Logic:**

```typescript
// 1. Load active fee structures for classroom
const feeStructures = await FeeStructure.find({
  classroomId,
  isActive: true,
}).populate("termId");

// 2. Get all active students in classroom
const students = await Student.find({
  classroomId,
  status: "active",
});

// 3. For each student-feeStructure combination:
for (const student of students) {
  for (const feeStructure of feeStructures) {
    const { term, amount } = feeStructure;
    const { name: termName, year } = term;

    // Check if fee record exists
    const hasFee = student.termFees.some(
      (fee) => fee.term === termName && fee.year === year
    );

    if (!hasFee) {
      // CREATE new fee record
      student.termFees.push({
        term: termName,
        year,
        amount,
        paid: false,
        pinCode: generatePinCode(), // 6-digit random
        viewable: false,
        createdAt: now,
      });
    } else {
      // UPDATE existing record
      const existingFee = student.termFees.find(
        (fee) => fee.term === termName && fee.year === year
      );

      // Update amount if changed
      if (existingFee.amount !== amount) {
        existingFee.amount = amount;
        existingFee.updatedBy = userId;
      }

      // Ensure PIN exists
      if (!existingFee.pinCode) {
        existingFee.pinCode = generatePinCode();
        existingFee.updatedBy = userId;
      }
    }
  }
}

// 4. Execute batch operations
await Student.bulkWrite(bulkOps, { ordered: false });
```

**Performance Optimizations:**

- **Batch Size:** 500 operations per batch
- **Bulk Writes:** Single DB operations for multiple records
- **Index Usage:** Efficient classroom/student lookups
- **Error Isolation:** Ordered: false to continue on failures

### 4.2 PIN Code Generation & Validation

**Security Model:**

```typescript
const BATCH_SIZE = 500;

// Cryptographically secure 6-digit PIN generation
function generatePinCode(): string {
  // Uses crypto.randomInt() for security
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}
```

**Usage in System:**

- **Generation:** When fee record is created or PIN missing
- **Validation:** Student enters PIN to view results after payment
- **Uniqueness:** Within fee record (not globally unique)
- **Visibility:** Only shown to parents/admins, never stored in plain frontend

**Result Access Logic:**

```typescript
const studentCanViewResults = (termFee: TermFee, providedPin?: string) => {
  // Rule 1: Fee must be paid
  if (!termFee.paid) return false;

  // Rule 2: Fee must be marked viewable
  if (!termFee.viewable) return false;

  // Rule 3: PIN must match if provided for verification
  if (providedPin && termFee.pinCode !== providedPin) return false;

  return true;
};
```

### 4.3 Health Check Reconciliation Algorithm

**Comprehensive System Analysis:**

```typescript
interface HealthReport {
  summary: {
    totalStudents: number;
    studentsWithMissingFees: number;
    studentsWithExtraFees: number;
    totalFeeDiscrepancies: number;
  };
  details: {
    missingFees: StudentIssue[];
    extraFees: StudentIssue[];
    classroomStats: ClassroomSummary[];
  };
  healthStatus: HealthStatus;
}
```

**Missing Fees Detection:**

```typescript
const detectMissingFees = (student: Student) => {
  const missingFees = [];

  // For each relevant FeeStructure
  for (const feeStructure of feeStructures) {
    const term = feeStructure.termId as any;

    // Skip if student enrolled after term ended
    const termEnd = new Date(term.endDate);
    const studentAdmitted = new Date(student.admissionDate);
    if (studentAdmitted > termEnd) continue;

    // Check if corresponding fee exists in student record
    const hasCorrespondingFee = student.termFees.some(
      (fee) => fee.term === term.name && fee.year === term.year
    );

    if (!hasCorrespondingFee) {
      missingFees.push({
        term: term.name,
        year: term.year,
        expectedAmount: feeStructure.amount,
      });
    }
  }

  return missingFees;
};
```

### 4.4 PIN Code Security Model

**Cryptographic Security:**

```typescript
function generateSecurePinCode(): string {
  // Uses Node.js crypto.randomInt() - cryptographically secure
  // Range: 0 to 999,999 (6 digits with leading zeros)
  const pinNumber = crypto.randomInt(0, 1000000);
  return pinNumber.toString().padStart(6, "0");
}
```

**PIN Code Properties:**

- **Length:** Exactly 6 digits
- **Character Set:** Numeric only (0-9)
- **Uniqueness:** Per fee record (not globally unique)
- **Generation:** Server-side only, never client-side
- **Storage:** Plain text in database (acceptable for this use)
- **Transmission:** Encrypted via HTTPS
- **Usage:** One-time display to parent/admin, then client validation

**Security Trade-offs:**

- PINs are not hashed because they need to be:
  - Displayed to parents for sharing with students
  - Verifiable by client-side validation
  - Short-lived (per academic term)

---

## 5. Frontend Component Architecture

### 5.1 Tab-based Navigation System

**Main Page Structure:** `client/src/app/admin/fees/page.tsx`

**4-Tab Architecture:**

```typescript
const tabs = [
  {
    id: "structures",
    label: "Fee Structures",
    icon: Building,
    component: FeeStructureTable,
  },
  {
    id: "students",
    label: "Student Fees",
    icon: Users,
    component: StudentFeeTable,
  },
  {
    id: "arrears",
    label: "Arrears Report",
    icon: BarChart3,
    component: ArrearsReport,
  },
  {
    id: "reconcile",
    label: "Reconciliation",
    icon: DollarSign,
    component: ReconcilePage,
  },
];
```

### 5.2 Fee Structure Management

**Components:**

- `FeeStructureTable` - CRUD operations with real-time updates
- `CreateFeeStructureModal` - Form with validation
- Real-time sync status notifications

**Key Features:**

```typescript
interface FeeStructureTableProps {
  onCreateClick: () => void;
  onEditClick: (structure: FeeStructure) => void;
}
```

### 5.3 Student Fee Administration

**Components:**

- `StudentFeeTable` - Student list with real-time summaries
- `StudentFeeRow` - Individual student with lazy-loaded fee data
- `MarkFeePaidModal` - Professional payment processing

**Real-time Fee Summaries:**

```typescript
// Hook: Fetches individual student fee summaries
const useStudentFeeSummary = (studentId?: string) => {
  return useQuery({
    queryKey: ["studentFeeSummary", studentId],
    queryFn: async (): Promise<FeeSummary> => {
      const response = await api.get(`/admin/fees/students/${studentId}/fees`);
      // Calculates: paidFees, unpaidFees, totalAmount
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};
```

### 5.4 Arrears Reporting System

**Features:**

- **Filtering:** By classroom, term, search
- **Real-time Calculations:** Student counts, total amounts
- **CSV Export:** Production-ready export functionality
- **Empty State Handling:** Clear messaging for no data

**CSV Export Implementation:**

```typescript
const headers = [
  "Student ID",
  "Name",
  "Class",
  "Term",
  "Year",
  "Amount",
  "PIN Code",
  "Payment Status",
];

const csvData = filteredArrears.flatMap((student) =>
  student.unpaidFees.map((fee) => ({
    studentId: student.studentId,
    fullName: student.fullName,
    currentClass: student.currentClass,
    term: fee.term,
    year: fee.year,
    amount: fee.amount,
    pinCode: fee.pinCode,
    paymentStatus: fee.paid ? "Paid" : "Unpaid",
  }))
);
```

### 5.5 Reconciliation Dashboard

**Components:**

- `HealthCheck` button with loading states
- `StatusSummary` cards with color coding
- `ClassroomStatistics` breakdown by classroom
- Action buttons: Deduplication, Backfill, Full Reconciliation

**Status Visualization:**

```typescript
const getStatusIcon = (status: string) => {
  switch (status) {
    case "healthy":
      return <CheckCircle className="text-green-500" />;
    case "warning":
      return <AlertCircle className="text-yellow-500" />;
    default:
      return <AlertCircle className="text-red-500" />;
  }
};
```

---

## 6. State Management & Data Fetching

### 6.1 Zustand Store Architecture

**Store:** `client/src/store/feeStore.ts`

**Centralized State Management:**

```typescript
interface FeeState {
  // Fee Structures State
  feeStructures: FeeStructure[];
  isLoadingFeeStructures: boolean;
  feeStructuresError: string | null;

  // Student Fees State
  studentFees: StudentFee | null;
  isLoadingStudentFees: boolean;
  studentFeesError: string | null;

  // Arrears State
  arrears: ArrearsData[];
  isLoadingArrears: boolean;
  arrearsError: string | null;

  // Modal Management
  isCreateFeeModalOpen: boolean;
  isMarkPaidModalOpen: boolean;
  selectedStudentForPayment: StudentFee | null;
}
```

**Actions:**

- **Modals:** Open/close state management
- **Data Updates:** setFeeStructures, setStudentFees
- **Loading States:** Per-operation loading indicators
- **Error Handling:** Structured error messages

### 6.2 TanStack Query Integration

**Query Client Configuration:**

```typescript
// Data fetching with caching and synchronization
const useFeeStructures = (options?: QueryOptions) => {
  return useQuery({
    queryKey: ["fee-structures"],
    queryFn: () => api.get("/admin/fees/structures"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};
```

**Mutation Operations:**

```typescript
export const useCreateFeeStructure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFeeStructure,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
    },
  });
};
```

### 6.3 Custom Hooks Structure

**Data Fetching Hooks:**

- `useFeeStructures()` - Fee structures with CRUD
- `useStudentFees()` - Student fee operations
- `useArrearsReport()` - Arrears data fetching
- `useStudentFeeSummary()` - Individual summaries

**Business Logic Hooks:**

- `useMarkFeePaid()` - Payment processing
- `useExportArrears()` - CSV generation
- `useHealthCheck()` - System monitoring

---

## 7. Synchronization Engine Details

### 7.1 Fee Structure Creation Sync

**Immediate Synchronization:**

```typescript
// When fee structure is created
POST /admin/fees/structures
├── Create FeeStructure record
├── Query students in classroom
├── Batch create termFees for ALL students
├── Generate unique PIN codes
├── Update student records
├── Create sync log
└── Audit trail entry
```

**Transactional Safety:**

- Batched operations to minimize DB load
- Error isolation - continue on individual failures
- Complete audit trail for every operation
- Rollback capability through sync logs

### 7.2 Student Enrollment Date Considerations

**Admission Date Filtering:**

```typescript
const studentEnrolledDuringTerm = (
  admissionDate: Date,
  termEndDate: Date
): boolean => {
  return admissionDate <= termEndDate;
};
```

**Health Check Logic:**

```typescript
// Don't create fees for students admitted after term ended
for (const feeStructure of feeStructures) {
  const term = feeStructure.termId as any;
  const termEnd = new Date(term.endDate);
  const studentAdmitted = new Date(student.admissionDate);

  if (studentAdmitted > termEnd) {
    continue; // Skip - student not enrolled during term
  }
}
```

### 7.3 Cross-term Fee Consistency

**Fee Amount Updates:**

```typescript
// When fee structure amount changes
PUT /admin/fees/structures/:id
├── Update FeeStructure.amount
├── Find all student termFees for this term
├── Update amounts in student records
├── Ensure PIN codes exist
├── Create sync log entry
└── Audit trail for amount changes
```

**Data Integrity Checks:**

- Cross-reference fee structures vs student records
- Validate PIN code presence on all fee records
- Detect orphaned fee records (no corresponding structure)
- Ensure consistent amounts across all student fees

---

## 8. Performance & Optimization

### 8.1 Batching Strategies

**Batch Size Optimization:**

```typescript
const BATCH_SIZE = 500; // Optimized for MongoDB

for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
  const batch = bulkOps.slice(i, i + BATCH_SIZE);
  await Student.bulkWrite(batch, { ordered: false });
}
```

**Why Batch Processing:**

- **Memory Efficiency:** Don't load all students at once
- **DB Performance:** Fewer round trips to MongoDB
- **Error Isolation:** One failed item doesn't stop batch
- **Monitoring:** Per-batch progress tracking

### 8.2 Indexing Strategy

**Database Indexes:**

```javascript
// Student model indexes
studentSchema.index({ currentClass: 1 });
studentSchema.index({ classroomId: 1 });
studentSchema.index({ status: 1 });

// FeeStructure model indexes
feeStructureSchema.index({ classroomId: 1, termId: 1 }, { unique: true });
feeStructureSchema.index({ isActive: 1 });
feeStructureSchema.index({ createdAt: -1 });

// FeeSyncLog model indexes
feeSyncLogSchema.index({ operationId: 1 }, { unique: true });
feeSyncLogSchema.index({ status: 1 });
feeSyncLogSchema.index({ startedAt: -1 });
```

**Query Optimization:**

- Compound indexes for common filters
- Timestamp indexes for time-based queries
- Unique constraints enforce data integrity
- Covering indexes for frequently accessed fields

### 8.3 Caching Implementation

**API Response Caching:**

```typescript
// React Query caching strategy
const queryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};
```

**Calculated Data Caching:**

- Fee summaries cached per-student
- Total amounts calculated client-side once loaded
- Export data cached during generation
- Health check results cached for dashboard display

### 8.4 Memory Management

**Large Dataset Handling:**

```typescript
// Stream processing for 1000+ students
const students = await Student.find(query).batchSize(100);

// Process in chunks to avoid memory pressure
for (const student of students) {
  // Process one student at a time
  await processStudentFees(student);
}
```

**Cursor-Based Processing:**

- MongoDB cursors for memory-efficient iteration
- Chunked processing for bulk operations
- Automatic cleanup of temporary data structures

---

## 9. Security & Audit Architecture

### 9.1 PIN Code Security Model

**PIN Security Features:**

```typescript
// Server-generated, cryptographically secure
function generatePinCode() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}
```

**Result Access Security:**

```typescript
const accessControlRules = {
  feePaid: boolean, // Payment required
  pinValid: boolean, // PIN verification
  viewable: boolean, // Explicit permission
  termValid: boolean, // Correct term access
};

const studentAccess = Object.values(accessControlRules).every(Boolean);
```

### 9.2 Audit Trail Implementation

**Comprehensive Audit Logging:**

```typescript
// Every operation creates audit log
const auditEntry = {
  userId: currentUser._id,
  actionType: "FEE_PAYMENT", // Operation type
  description: "Marked fee as paid for John Doe term 2024",
  targetId: student._id, // Affected record
  metadata: {
    // Additional details
    term: "1st",
    year: 2024,
    amount: 45000,
  },
};
```

**Audit Categories:**

- `FEE_STRUCTURE_CREATE` - New fee structures
- `FEE_STRUCTURE_UPDATE` - Amount changes
- `FEE_STRUCTURE_DELETE` - Structure removal
- `FEE_PAYMENT` - Payment processing
- `FEE_STRUCTURE_UPDATE` - Sync operations

### 9.3 Role-based Access Control

**Permission Requirements:**

```typescript
const feePermissions = {
  structures: {
    read: "fees.read",
    create: "fees.create",
    update: "fees.update",
    delete: "fees.delete",
  },
  payments: {
    pay: "fees.pay",
    sync: "fees.sync",
    health: "fees.health",
  },
};
```

**Middleware Enforcement:**

```typescript
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: Function) => {
    const hasPermission = await checkPermission(req.user._id, permission);
    if (!hasPermission) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};
```

---

## 10. Maintenance & Troubleshooting

### 10.1 Health Check Procedures

**Automated Health Monitoring:**

```typescript
const healthCheckProcedure = {
  frequency: "weekly", // How often to run
  trigger: "manual", // How to initiate
  analysis: {
    // What to check
    missingFees: true,
    extraFees: true,
    classroomStats: true,
    dataConsistency: true,
  },
  alerts: {
    // When to notify
    threshold: 5, // Issues before alert
    channels: ["email", "dashboard"],
    escalation: "immediate",
  },
};
```

**Weekly Maintenance Schedule:**

```bash
# 1. Run health check
curl -X GET /admin/fees/health-check

# 2. Analyze results
# Check for: discrepancies > 0, critical issues

# 3. Run automated fixes
# - Backfill missing fees
# - Remove orphaned records
# - Update inconsistent data

# 4. Verify fixes worked
# Re-run health check, confirm issues resolved
```

### 10.2 Manual Reconciliation Procedures

**Data Consistency Issues:**

```typescript
// Find students missing fees for active terms
const missingFeesQuery = [
  { $match: { status: "active" } },
  {
    $lookup: {
      from: "feestructures",
      localField: "classroomId",
      foreignField: "classroomId",
      as: "feeStructures",
    },
  },
  {
    $project: {
      fullName: 1,
      studentId: 1,
      termFees: 1,
      missingFees: {
        // Complex comparison logic here
      },
    },
  },
];
```

**Orphaned Fee Removal:**

```typescript
// Find and remove fee records with no corresponding FeeStructure
const orphanedFees = await Student.aggregate([
  { $unwind: "$termFees" },
  {
    $lookup: {
      from: "feestructures",
      let: {
        classroomId: "$classroomId",
        term: "$termFees.term",
        year: "$termFees.year",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$classroomId", "$$classroomId"] },
                { $eq: ["$termId.name", "$$term"] },
                { $eq: ["$termId.year", "$$year"] },
              ],
            },
          },
        },
      ],
      as: "structure",
    },
  },
  { $match: { structure: { $size: 0 } } }, // No matching fee structure
  {
    $project: {
      fullName: 1,
      studentId: 1,
      orphanedFee: "$termFees",
    },
  },
]);
```

### 10.3 Data Consistency Validation

**Integrity Check Scripts:**

```typescript
// Comprehensive data validation
const dataValidationQueries = {
  duplicateFees: `
    Find students with multiple fees for same term/year
    Exclude legitimate bulk operations
  `,

  amountMismatches: `
    Compare student termFees.amount vs FeeStructure.amount
    Flag discrepancies requiring update
  `,

  missingStudentRecords: `
    Students referenced in operations but not in database
    Usually indicates cleanup issues
  `,

  orphanedAuditLogs: `
    Audit entries pointing to deleted records
    Acceptable after soft deletes
  `,

  pinCodeMissing: `
    Fee records without required PIN codes
    Auto-regenerate during next sync
  `,
};
```

---

## Conclusion

This technical specification provides complete documentation of the sophisticated fee management system, covering everything from database schema design to performance optimization strategies. The system represents a production-ready, enterprise-grade solution for comprehensive school fee administration with automated synchronization, health monitoring, and secure result access control.

**Key Technical Achievements:**

- **Scalable Architecture:** Handles 1000+ students efficiently
- **Data Integrity:** Comprehensive reconciliation and health checking
- **Audit Compliance:** Complete financial transaction tracking
- **Automated Operations:** Zero-touch fee synchronization
- **Security Model:** PIN-based result access control
- **Performance Optimized:** Batch processing and intelligent caching

This documentation serves as the comprehensive technical reference for developers, maintainers, and stakeholders implementing or extending the fee management system.
