# Treasure Land School Management System MVP

## Features

- Role-based dashboards (admin, teacher, student, parent)
- Attendance tracking
- Result management with PIN + fee lock
- Messaging and announcements
- Audit logs for sensitive actions
- PDF export for results
- Handles edge cases: mid-term join, teacher reassignment, multiple children, offline use

## Setup

1. `cd client && npm install`
2. `npm run dev` to start frontend
3. `cd ../server && npm install`
4. `npm run dev` to start backend
5. Configure `.env` for API URLs and MongoDB

## Testing

- Simulate edge cases via `/edge-cases` page
- Use dashboards for each role to test features

---

For more, see `/src/app/features.tsx` and `/src/app/edge-cases.tsx`.
