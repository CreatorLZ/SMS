# Parent Portal Index

## Overview

The Parent Portal is a comprehensive web application component within the Treasure Land school management system that allows parents/guardians to monitor and engage with their children's academic progress and school activities.

## Architecture

### Frontend Structure

- **Location**: `client/src/app/parent/`
- **Main Dashboard**: `page.tsx` - Parent dashboard with overview of children's performance
- **Login Page**: `login/page.tsx` - Authentication entry point for parents

### Key Components

- **TerminalLoginForm**: Shared login component used across portals
- **DashboardLayout**: Consistent layout wrapper for authenticated parent views
- **RoleGuard**: Access control component ensuring only parents can access parent-specific features

### State Management

- **Parent Store** (`client/src/store/parentStore.ts`): Manages linked student data
  - Stores array of linked students with basic information
  - Provides `setChildren` method to update student list

### API Integration

- **Parent Hook** (`client/src/hooks/useParent.ts`): Handles parent-specific API calls
  - `useFetchChildren()`: Retrieves linked student profiles from `/parent/dashboard` endpoint

## Features

### Dashboard Overview

The parent dashboard provides a comprehensive view of children's academic status:

#### Children Overview Cards

- Displays each child's name, grade, GPA, and attendance percentage
- Color-coded status badges (Excellent, Good, Needs Attention, Concerning)
- Quick action buttons for viewing grades and attendance

#### Notifications System

- Recent notifications about grades, attendance, and events
- Priority-based alerts (normal/warning)
- Categorized by type (grade, attendance, event)

#### Upcoming Events

- Parent-teacher conferences
- School events and academic deadlines
- Calendar integration with date/time details

#### Quick Actions

- My Children: View detailed child profiles
- Progress Reports: Academic performance summaries
- Attendance: Detailed attendance records
- Messages: Communication with school staff

#### Family Summary

- Total number of children
- Average GPA across all children
- Average attendance percentage

### Authentication & Access Control

- Role-based access restricted to "parent" role
- Linked student verification through `linkedStudentIds` in User model
- Secure API endpoints with authorization middleware

### Attendance Monitoring

- Parents can view attendance history for their children
- Date range filtering capabilities
- Status tracking (present, absent, late)

### Results Access

- PIN-based verification system for viewing academic results
- Fee payment verification before result access
- Term-specific result viewing with audit logging

## Backend Integration

### Database Models

- **User Model**: Contains `linkedStudentIds` array referencing Student documents
- **Student Model**: Stores academic records, attendance, and results
- **Attendance Model**: Tracks daily attendance records

### API Endpoints

- `GET /api/student/attendance` - Attendance history (accessible by parents for linked students)
- `POST /api/student/results/verify` - PIN-verified result access
- `GET /api/parent/dashboard` - Parent dashboard data

### Security Features

- JWT-based authentication
- Role authorization middleware
- Audit logging for sensitive operations
- PIN-based result access control

## Data Flow

1. **Authentication**: Parent logs in via TerminalLoginForm
2. **Dashboard Load**: `useFetchChildren` hook retrieves linked student data
3. **Data Display**: Dashboard renders overview cards, notifications, and events
4. **Child-Specific Actions**: Links navigate to detailed views (grades, attendance)
5. **API Calls**: Protected endpoints verify parent-child relationships

## Established Patterns & Architecture

### Portal Structure Patterns

- **Consistent Layout**: All portals use `DashboardLayout` with `RoleGuard` for access control
- **Login Pattern**: Shared `TerminalLoginForm` component with portal-specific titles
- **State Management**: Zustand stores with role-specific data (authStore, parentStore)
- **API Integration**: React Query hooks with consistent error handling and caching

### Data Fetching Patterns

- **Hook-based Queries**: Custom hooks using `useQuery` with proper caching (`staleTime`, `gcTime`)
- **Error Handling**: Exponential backoff retry logic, 4xx status code handling
- **Query Keys**: Descriptive arrays for cache invalidation
- **Authorization**: Role-based access in both frontend guards and backend middleware

### Component Patterns

- **Card-based Layouts**: Statistics cards with icons and color coding
- **Grid Systems**: Responsive grids (md:grid-cols-2, lg:grid-cols-4)
- **Icon Usage**: Lucide React icons consistently applied
- **Badge System**: Status indicators with semantic colors

### Backend Patterns

- **Route Organization**: Role-specific route files with middleware protection
- **Controller Structure**: CRUD operations with consistent error responses
- **Authorization**: `protect` and `authorize` middleware for access control
- **Audit Logging**: Security events tracked for compliance

## Current Implementation Status

### Implemented Features

- ✅ Parent authentication and login
- ✅ Dashboard overview with mock data
- ✅ Linked student management via `linkedStudentIds`
- ✅ Attendance history viewing (shared with student routes)
- ✅ PIN-based result verification (shared with student routes)
- ✅ Basic notification system

### Planned/Missing Features

- 🔄 **Backend Endpoints**: Parent-specific API routes and controllers
- 🔄 **Real Data Integration**: Replace mock data with actual API calls
- 🔄 **Detailed Views**: Grade viewing, progress reports, messaging
- 🔄 **Fee Tracking**: Payment status and history
- 🔄 **Real-time Features**: Notifications, messaging system
- 🔄 **Parent-Teacher Communication**: Direct messaging tools

## Implementation Roadmap

### Phase 1: Backend Infrastructure ✅ COMPLETED

1. **Create Parent Routes** (`server/src/routes/parent/`)

   - Dashboard data endpoint (`GET /api/parent/dashboard`)
   - Child-specific data endpoints
   - Follow established route patterns with middleware

2. **Create Parent Controller** (`server/src/controllers/parent/`)

   - Dashboard data aggregation with real GPA/attendance calculation
   - Child information retrieval
   - Follow existing controller patterns

3. **Update Student Routes**
   - Add parent authorization to existing student endpoints
   - Ensure proper access control for linked students

### Phase 2: Frontend Data Integration ✅ COMPLETED

1. **Update Parent Hooks**

   - Replace mock data with real API calls
   - Implement proper error handling and loading states
   - Follow established hook patterns

2. **Create Child-Specific Pages** 🔄 IN PROGRESS

   - `/parent/child/[studentId]/grades` - Grade viewing
   - `/parent/child/[studentId]/attendance` - Attendance details
   - `/parent/child/[studentId]/results` - Result access

3. **Enhance Dashboard**
   - Real-time data loading
   - Dynamic child cards based on API data
   - Proper state management integration

## Revised Child-Specific Pages Implementation Plan

### **Critical Missing Components Identified:**

1. **Complete Directory Structure Missing** - Dashboard links to non-existent routes
2. **Loading Components** - Need `loading.js` files following admin portal pattern
3. **Navigation Links** - Sidebar and quick actions reference missing pages
4. **Route Parameters** - Dynamic `[studentId]` routes not implemented

### **Required Directory Structure:**

```
client/src/app/parent/
├── loading.js                    # Parent portal loading component
├── page.tsx                      # ✅ Dashboard (implemented)
├── login/
│   └── page.tsx                  # ✅ Login (implemented)
├── child/
│   └── [studentId]/
│       ├── loading.js            # Child-specific loading
│       ├── grades/
│       │   ├── loading.js
│       │   └── page.tsx          # Child grades view
│       ├── attendance/
│       │   ├── loading.js
│       │   └── page.tsx          # Child attendance view
│       └── results/
│           ├── loading.js
│           └── page.tsx          # Child results view
├── children/
│   ├── loading.js
│   └── page.tsx                  # All children overview
├── progress/
│   ├── loading.js
│   └── page.tsx                  # Progress reports
├── attendance/
│   ├── loading.js
│   └── page.tsx                  # Family attendance overview
└── messages/
    ├── loading.js
    └── page.tsx                  # Parent-teacher messages
```

### **Loading Component Pattern:**

Following admin portal pattern with:

- Treasure Land logo animation
- Bouncing dots loading indicator
- Gradient background
- Consistent branding

### **Page Implementation Priority:**

#### **Phase 1: Core Child-Specific Pages**

1. **Child Grades Page** (`/parent/child/[studentId]/grades`)

   - Display student's grades across all subjects/terms
   - GPA calculation and trends
   - Subject-wise performance breakdown

2. **Child Attendance Page** (`/parent/child/[studentId]/attendance`)

   - Detailed attendance history with date ranges
   - Attendance percentage calculations
   - Absence/presence patterns

3. **Child Results Page** (`/parent/child/[studentId]/results`)
   - PIN-protected access to term results
   - PDF download capability
   - Results publication status

#### **Phase 2: Supporting Pages**

4. **Children Overview** (`/parent/children`)

   - All linked children in one view
   - Quick access to individual child pages
   - Family-wide statistics

5. **Progress Reports** (`/parent/progress`)

   - Academic progress tracking
   - Report generation and history
   - Performance analytics

6. **Family Attendance** (`/parent/attendance`)

   - Combined attendance view for all children
   - Comparative analytics
   - Attendance trends

7. **Messages** (`/parent/messages`)
   - Parent-teacher communication
   - Message history and threads
   - Notification preferences

### **Backend Endpoints Required:**

#### **Child-Specific Data Endpoints:**

- `GET /api/parent/child/:studentId/grades` - Child's grade data
- `GET /api/parent/child/:studentId/attendance` - Child's attendance history
- `GET /api/parent/child/:studentId/results` - Child's results (with PIN verification)
- `GET /api/parent/child/:studentId/profile` - Child's profile information

#### **Supporting Endpoints:**

- `GET /api/parent/children` - All linked children overview
- `GET /api/parent/progress` - Progress reports data
- `GET /api/parent/messages` - Message threads and history

### **Authorization Strategy:**

- **Route Guards**: Parent role + student ownership verification
- **API Validation**: Parent-child relationship checks in all endpoints
- **Parameter Validation**: Student ID format and ownership validation
- **Error Handling**: Clear error messages for unauthorized access

### **Component Patterns:**

- **Consistent Headers**: Child name, class, breadcrumb navigation
- **Loading States**: Skeleton loaders and proper loading indicators
- **Error Boundaries**: Graceful error handling with retry options
- **Responsive Design**: Mobile-friendly layouts following admin patterns

### Phase 3: Advanced Features

1. **Messaging System**

   - Parent-teacher communication
   - Notification preferences
   - Message history

2. **Progress Reports**

   - Academic performance tracking
   - Report generation and download
   - Historical data visualization

3. **Fee Management**
   - Payment status tracking
   - Fee history and outstanding balances
   - Payment notifications

### Phase 4: Real-time Features

1. **Notifications**

   - Real-time grade updates
   - Attendance alerts
   - Event reminders

2. **Live Updates**
   - WebSocket integration for real-time data
   - Push notifications
   - Instant messaging

## Technical Notes

- Uses Next.js 13+ with App Router
- TypeScript for type safety
- Zustand for client-side state management
- React Query for server state management
- Tailwind CSS for styling
- Lucide React for icons

## Dependencies

### Frontend

- React, Next.js
- Zustand, React Query
- Tailwind CSS, Lucide Icons
- Custom UI components

### Backend

- Express.js, MongoDB
- JWT authentication
- Role-based access control
- Audit logging system
