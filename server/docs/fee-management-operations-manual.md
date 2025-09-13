# Fee Management System Operations Manual

## Introduction

This manual provides step-by-step instructions for operating the School Fee Management System. It covers daily procedures, setup tasks, and troubleshooting for users who manage school fees.

---

## Table of Contents

### [Quick Start Guide](#quick-start-guide)

- [Logging In](#logging-in)
- [Navigation Overview](#navigation-overview)
- [Understanding the Interface](#understanding-the-interface)

### [Fee Structures Setup](#fee-structures-setup)

- [Creating Fee Structures](#creating-fee-structures)
- [Editing Fee Structures](#editing-fee-structures)
- [Viewing All Fee Structures](#viewing-all-fee-structures)

### [Student Fee Management](#student-fee-management)

- [Viewing Student Fee Records](#viewing-student-fee-records)
- [Processing Fee Payments](#processing-fee-payments)
- [Marking Fees as Paid](#marking-fees-as-paid)

### [Arrears Management](#arrears-management)

- [Viewing Outstanding Fees](#viewing-outstanding-fees)
- [Filtering Arrears Reports](#filtering-arrears-reports)
- [Exporting Arrears Data](#exporting-arrears-data)

### [System Monitoring](#system-monitoring)

- [Health Check](#health-check)
- [Understanding Status Messages](#understanding-status-messages)
- [Running Reconciliation](#running-reconciliation)

### [Daily Procedures](#daily-procedures)

- [Morning Fee Processing](#morning-fee-processing)
- [Parent Payment Handling](#parent-payment-handling)
- [End of Day Procedures](#end-of-day-procedures)

### [Troubleshooting](#troubleshooting)

- [Common Issues](#common-issues)
- [Error Messages](#error-messages)
- [Technical Support](#technical-support)

---

## Quick Start Guide

### Logging In

1. Open your web browser and navigate to the school management system URL
2. Enter your username and password
3. Click the "Login" button

**Result:** You will be redirected to the main dashboard.

### Navigation Overview

**Accessing Fee Management:**

1. Click "Admin" in the main navigation menu
2. Select "Fees" from the dropdown menu
3. You will see the Fee Management dashboard with four tabs

**Four Main Tabs:**

- **Fee Structures** - Manage pricing by classroom and term
- **Student Fees** - Manage individual student payments
- **Arrears Report** - View outstanding fees
- **Reconciliation** - System health and maintenance

### Understanding the Interface

**Tab Navigation:**

- Click any tab name to switch between different sections
- Active tab is highlighted with white background and darker text

**Data Tables:**

- Click column headers to sort data
- Search boxes above tables filter visible rows
- Pagination controls at bottom for large datasets

---

## Fee Structures Setup

### Creating Fee Structures

**Step-by-step process to set up fee pricing:**

1. Navigate to the Fee Management page
2. Click on the "Fee Structures" tab
3. Click the "Create Fee Structure" button
4. Fill in the form:
   - **Classroom**: Select the classroom (e.g., "Junior Secondary School 1")
   - **Academic Term**: Select the term (e.g., "1st Term")
   - **Academic Year**: Select the year (e.g., "2024")
   - **Fee Amount**: Enter the amount (e.g., "45000")
5. Click "Create Fee Structure"

**What happens next:**

- System creates the fee structure
- Automatically generates fee records for all students in the selected classroom
- Creates unique PIN codes for result access
- Shows confirmation message with operation details

### Editing Fee Structures

**To modify an existing fee amount:**

1. Go to "Fee Structures" tab
2. Find the fee structure you want to edit
3. Click the "Edit" button (pencil icon) in the Actions column
4. Change the fee amount in the dialog
5. Click "Save Changes"

**Important:** When you change a fee amount, the system automatically updates all student records for that classroom/term combination.

### Viewing All Fee Structures

**To see current fee pricing:**

1. Click "Fee Structures" tab (default view)
2. View the table showing all active fee structures
3. Columns display:
   - Classroom name and grade
   - Term and year
   - Fee amount
   - Creation and update dates

---

## Student Fee Management

### Viewing Student Fee Records

**To check a student's fee history:**

1. Navigate to "Student Fees" tab
2. See list of all students (default view sorted by name)
3. Each row shows:
   - Student name and ID
   - Current class
   - Total fees owed
   - Total fees paid
   - Outstanding balance

**View detailed fees for a specific student:**

1. Click the down arrow next to a student's name
2. Or search for student using the search box
3. Click "View Details" when expanded view appears

**Detailed view shows:**

- Complete fee history by term
- Payment status (paid/unpaid)
- PIN codes for result access
- Payment dates and methods

### Processing Fee Payments

**When a parent pays a fee:**

1. Go to "Student Fees" tab
2. Find the student (use search or scroll)
3. Click the student's row to expand
4. Click "Mark as Paid" button for the specific term
5. Fill in the payment details:
   - **Payment Method**: Select from dropdown (Cash, Bank Transfer, etc.)
   - **Receipt Number**: Enter receipt number (auto-generated if blank)
6. Click "Mark Fee as Paid"

**Result:** Fee status changes to "Paid", PIN code becomes visible for result access.

### Marking Fees as Paid

**Payment form fields:**

- **Term**: Select which term's fee is being paid
- **Year**: Select the academic year
- **Payment Method**: Required field - choose appropriate method
- **Receipt Number**: Optional - leave blank for auto-generation

**After submission:**

- System records the payment
- Updates student's balance
- Makes PIN code available for result access
- Creates audit trail entry

---

## Arrears Management

### Viewing Outstanding Fees

**Access arrears information:**

1. Click "Arrears Report" tab
2. View table of students with outstanding fees
3. Default sorting shows highest amounts first
4. Each row displays:
   - Student name and ID
   - Current class
   - Number of outstanding fees
   - Total amount owed

**Individual student arrears:**

- Click student's row to expand
- See breakdown by term and year
- View PIN codes for contacting students

### Filtering Arrears Reports

**Refine arrears view:**

**By Classroom:**

1. Click the "Classroom" dropdown
2. Select specific classroom or choose "All"
3. Table updates to show selected classroom(s)

**By Term:**

1. Click "Term" dropdown
2. Select "1st Term", "2nd Term", "3rd Term", or "All"

**By Year:**

1. Click "Year" dropdown
2. Select academic year or choose "All"

**Search by Name:**

- Type student name in search box above table
- Table filters to show matching students

### Exporting Arrears Data

**Export to CSV file:**

1. Click the "Export CSV" button
2. Browser will download a CSV file
3. File contains all visible data in spreadsheet format

**Export includes:**

- Student ID and name
- Classroom
- Outstanding term and year
- Fee amounts
- PIN codes for result access

---

## System Monitoring

### Health Check

**Check system status:**

1. Navigate to "Reconciliation" tab
2. Click the "Run Health Check" button
3. Wait for system analysis to complete (seconds to minutes)

**Health check results show:**

- Overall system status
- Number of students checked
- Missing fees count
- Extra fees count
- Classroom-by-classroom breakdown

### Understanding Status Messages

**Status indicators:**

**Healthy (Green):**

- Zero missing or extra fee records
- All systems functioning normally
- No action required

**Warning (Yellow):**

- Minor discrepancies found
- System still functional
- Review and potentially run reconciliation

**Critical (Red):**

- Major data integrity issues
- System functionality may be affected
- Immediate attention required

### Running Reconciliation

**Fix detected issues:**

**Option 1 - Run Deduplication:**

1. Click "Run Deduplication" button
2. System removes duplicate fee entries
3. Safe operation with audit trail

**Option 2 - Backfill Missing Fees:**

1. Click "Backfill Missing Fees" button
2. System creates missing fee records
3. Generates PIN codes automatically

**Option 3 - Full Reconciliation:**

1. Click "Full Reconciliation" button (advanced users only)
2. Complete system rebuild
3. Only use when instructed by technical support

---

## Daily Procedures

### Morning Fee Processing

**Daily fee management routine:**

1. **Check Arrears Report**

   - Navigate to "Arrears Report" tab
   - Review outstanding fees
   - Note any urgent cases (high amounts or overdue)

2. **Process Overnight Payments**

   - Check for bank transfers received
   - Mark fees as paid for confirmed payments
   - Update payment methods and receipt numbers

3. **Handle Parent Inquiries**

   - Search for student when parent calls
   - Show current balance and payment history
   - Process on-site payments as needed

4. **Review System Health**
   - Run quick health check
   - Address any warning messages

### Parent Payment Handling

**When parent arrives to pay fees:**

1. **Find Student Record**

   - Go to "Student Fees" tab
   - Search by student name or ID
   - Expand student row to see fee details

2. **Determine Payment Amount**

   - Check outstanding fees
   - Note specific terms that need payment
   - Communicate total amount due

3. **Record Payment**

   - Click "Mark as Paid" for appropriate term
   - Select payment method (usually "Cash")
   - Enter receipt number if applicable
   - Confirm payment processing

4. **Provide PIN Information**
   - Copy or note the PIN code
   - Explain PIN usage for result access
   - Advise parent to share PIN with student carefully

### End of Day Procedures

**Daily closure tasks:**

1. **Verify All Payments Recorded**

   - Check "Arrears Report" for any forgotten entries
   - Confirm large payments processed correctly

2. **Review Today's Changes**

   - Check audit logs if available
   - Note any issues that occurred

3. **Health Check**

   - Run quick health check
   - Address any new issues

4. **Backup Considerations**
   - System automatically maintains records
   - No manual backup required

---

## Troubleshooting

### Common Issues

**Student Not Appearing in Fee List**

- Check student is enrolled in active classroom
- Verify fee structure exists for their term/year
- Run health check to identify missing records

**PIN Code Not Showing After Payment**

- Confirm fee is marked as paid
- Check correct term/year was selected
- Refresh page and try again

**Cannot Export CSV**

- Filter data to reduce size (by classroom)
- Try during off-peak hours
- Check internet connection

**System Running Slowly**

- Limit time range filters
- Close unnecessary browser tabs
- Try system during off-peak hours

**Fee Amount Not Updating**

- Check fee structure was edited correctly
- Wait for automatic synchronization (up to 5 minutes)
- Refresh page to see updates

### Error Messages

**"Payment method is required"**

- Solution: Select a payment method from the dropdown when marking fees paid

**"Duplicate fee structure exists"**

- Solution: Check if fee structure already exists for that classroom/term combination

**"Health check in progress"**

- Solution: Wait for current health check to complete before starting another

**"Export too large"**

- Solution: Filter data by classroom or term before exporting

**"Student not found"**

- Solution: Check spelling of student name or use student ID

### Technical Support

**When to contact support:**

- Error messages you cannot resolve
- System completely unavailable
- Data inconsistencies that affect operations
- New functionality you need help with

**Contact Information:**

- System Administrator: [Contact information]
- Technical Support: [Support phone/email]
- Emergency Line: [24/7 support for system outages]

---

## Reference Tables

### Payment Methods

| Method        | Description           | When to Use             |
| ------------- | --------------------- | ----------------------- |
| Cash          | Counter payment       | Parent pays at school   |
| Bank Transfer | Direct bank deposit   | Electronic transfer     |
| Online        | School payment portal | Pre-online fee payments |
| Check         | Bank draft            | Formal payment clearing |
| Mobile Money  | MTN/Airtel Money      | Mobile wallet payment   |

### Status Indicators

| Status   | Color  | Meaning               | Action                        |
| -------- | ------ | --------------------- | ----------------------------- |
| Healthy  | Green  | All systems normal    | None required                 |
| Warning  | Yellow | Minor issues detected | Review and potentially fix    |
| Critical | Red    | Major problems        | Stop operations, call support |

### Fee Structure Fields

| Field         | Required | Description        | Example                   |
| ------------- | -------- | ------------------ | ------------------------- |
| Classroom     | Yes      | Student class      | Junior Secondary School 1 |
| Academic Term | Yes      | Term of year       | 1st Term                  |
| Academic Year | Yes      | School year        | 2024                      |
| Fee Amount    | Yes      | Amount in currency | 45000                     |

### Health Check Results

| Result                     | Description                           | Typical Action                   |
| -------------------------- | ------------------------------------- | -------------------------------- |
| Students with Missing Fees | Students without required fee records | Run backfill reconciliation      |
| Students with Extra Fees   | Extra/duplicate fee records exist     | Run deduplication                |
| Classroom Statistics       | Per-class status breakdown            | Review detailed classroom issues |

---

## Quick Reference

### Keyboard Shortcuts

**Standard browser shortcuts work as expected**

### Data Entry Tips

- **Student Search**: Type first few letters for quick filtering
- **Amount Entry**: Enter numbers only (no currency symbols)
- **Receipt Numbers**: Leave blank for auto-generation
- **PIN Codes**: Copy carefully for parent communication

### Best Practices

1. **Always Search First**: Use search boxes instead of scrolling
2. **Filter Before Export**: Reduce data size for faster exports
3. **Run Health Check Weekly**: Catch issues early
4. **Document Changes**: Note fee structure changes for reference
5. **Verify Payments**: Double-check large or unusual payments

---

This manual covers all essential operations for managing school fees through the system. For technical documentation or advanced features, refer to the separate technical specification document.
