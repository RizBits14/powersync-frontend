# PowerSync — Load Shedding & Power Outage Management Platform

PowerSync is a full-stack web application for managing power outages, load shedding schedules, restoration operations, electricity billing, and operational analytics. It connects customers, administrators, and field operators through a centralized outage management workflow.

Built as an academic software engineering project, PowerSync features role-based authentication, Google Sign-In, Stripe Checkout, real backend integration, audit logging, notifications, infrastructure management, and responsive dashboards.

## Key Features

### Customer

- Email/password authentication and Google Sign-In
- Customer profile and service area management
- Submit and track outage reports
- View planned load shedding schedules
- View electricity bills and payment history
- Pay eligible bills through Stripe Checkout
- Receive system notifications

### Operator

- View verified outage reports
- Group related reports through smart outage clustering
- Create and manage outage incidents
- Accept assigned restoration tasks
- Track restoration progress and confirm service restoration
- Receive operational notifications

### Administrator

- Review and verify outage reports
- Manage incidents and assign operators
- Monitor the restoration workflow
- Create and publish load shedding schedules
- Manage zones, substations, feeders, and service areas
- Manage customer electricity bills and monitor payments
- View operational analytics and reliability metrics
- Manage users, audit logs, and system-wide notifications

## Outage Management Workflow

PowerSync coordinates the complete outage lifecycle:

```text
Customer Reports Outage
        ↓
Admin Verifies Report
        ↓
Operator Groups Related Reports
        ↓
Incident Created
        ↓
Admin Assigns Operator
        ↓
Operator Restores Service
        ↓
Admin Closes Incident
```

The system also supports planned interruptions, billing, payment processing, notifications, and infrastructure-level operational monitoring.

## Technology Stack

| Category           | Technologies                                                     |
| ------------------ | ---------------------------------------------------------------- |
| Frontend           | Next.js, React, TypeScript                                       |
| Styling            | Tailwind CSS, shadcn/ui                                          |
| Data & State       | TanStack Query, Zustand                                          |
| Forms & Validation | React Hook Form, Zod                                             |
| Charts             | Recharts                                                         |
| Backend            | Express, TypeScript, Prisma                                      |
| Authentication     | JWT-backed sessions, HTTP-only cookies, Google Identity Services |
| Payments           | Stripe Checkout, Stripe Webhooks                                 |
| Deployment         | Vercel                                                           |

## Application Architecture

PowerSync uses the Next.js App Router and a Backend-for-Frontend (BFF) architecture to communicate with its REST API.

```text
Browser
   ↓
Next.js Frontend
   ↓
Next.js BFF Routes
   ↓
PowerSync REST API
   ↓
Database / Stripe / Google
```

Authentication uses HTTP-only session cookies, while protected application routes and backend endpoints enforce role-based access control.

The application provides separate workspaces for:

- **Customers:** `/dashboard`
- **Operators:** `/operator`
- **Administrators:** `/admin`

## Integrations

- **Google Sign-In:** Authenticate customers using Google Identity Services, with credential verification handled by the backend.
- **Stripe Checkout:** Process bill payments and update payment records through backend webhook verification.
- **Analytics:** Visualize outage trends, incident priorities, and area and feeder reliability.
- **Audit Logging:** Record important administrative and operational activities.
- **Notifications:** Deliver customer and operator notifications and administrator broadcasts.

## Backend API

**Production API:**  
https://powersync-api.vercel.app/api/v1

**Health Endpoint:**  
https://powersync-api.vercel.app/api/v1/health

**Backend Repository:**  
https://github.com/RizBits14/load-shedding-power-outage-management-api

The frontend integrates with real backend endpoints for its core application functionality.

## Getting Started

### Prerequisites

- Node.js and npm
- Access to the PowerSync backend API
- Google OAuth credentials for Google Sign-In
- Stripe configuration on the backend for payment testing

### Installation

Clone the frontend repository:

```bash
git clone https://github.com/rizbits14/powersync-frontend
cd powersync-frontend
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
POWERSYNC_API_BASE_URL=https://powersync-api.vercel.app/api/v1

NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_WEB_CLIENT_ID

DEMO_ADMIN_EMAIL=admin@powersync.com
DEMO_OPERATOR_EMAIL=operator1@powersync.com
DEMO_CUSTOMER_EMAIL=customer1@powersync.com
DEMO_ACCOUNT_PASSWORD=YOUR_DEMO_ACCOUNT_PASSWORD
```

Keep `.env` private and never commit credentials or secrets to the repository. Only values intended for browser access should use the `NEXT_PUBLIC_` prefix.

### Run Locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Available Scripts

| Command                | Purpose                      |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start the development server |
| `npm run format`       | Format the codebase          |
| `npm run format:check` | Check code formatting        |
| `npm run typecheck`    | Run TypeScript validation    |
| `npm run lint`         | Run ESLint                   |
| `npm run build`        | Create a production build    |
| `npm run start`        | Start the production server  |

Before deployment, validate the project:

```bash
npm run format
npm run typecheck
npm run lint
npm run build
```

## Deployment

PowerSync is designed for deployment on Vercel.

1. Import the frontend repository into Vercel.
2. Configure the required environment variables.
3. Deploy the application.
4. Add the production frontend origin to the authorized JavaScript origins in Google Cloud Console.
5. Configure the backend's Stripe return URLs to use the deployed frontend domain.
6. Verify authentication, role authorization, billing, payment webhooks, and the core outage workflow.

Stripe payment status must be confirmed by the backend, not by the frontend redirect alone.

## Security and Reliability

PowerSync incorporates several security and usability practices:

- HTTP-only authentication cookies
- Role-based access control on the frontend and backend
- Backend verification of Google credentials
- Server-side handling of sensitive environment variables
- Webhook-based Stripe payment verification
- Form validation using React Hook Form and Zod
- Loading, error, success, and empty states
- Responsive layouts for mobile, tablet, and desktop
