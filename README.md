# LendTrack - Money Lending Management PWA

A Progressive Web Application for managing money lending operations with user and admin functionality.

## Features

### User Features
- Dashboard with 4 summary cards (Outstanding Balance, Active Loans, Next Due Date, Last Payment)
- Loan request form
- Payment and loan history
- Comment/issue reporting system
- Help and contact page

### Admin Features
- Admin dashboard with all users and loans
- Quick action buttons for marking loans as Paid or Unpaid
- Payment recording with transaction ID tracking
- Payment reversal with reason tracking
- Role-based access control

### PWA Features
- Installable on mobile devices
- Offline-capable (read-only mode)
- Service worker caching
- Mobile-first responsive design

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account

### Installation

1. Install dependencies:
```bash
npm install
```

2. The Supabase connection is already configured in `.env`

3. Create test users in Supabase:

Since Supabase Auth manages users, you need to create test accounts through the Supabase Dashboard or through the application:

**Option 1: Using Supabase Dashboard**

Go to your Supabase Dashboard > Authentication > Users and create:

Admin user:
- Email: admin@lendtrack.com
- Password: admin123
- After creation, go to SQL Editor and run:
```sql
INSERT INTO users (id, email, full_name, role, outstanding_balance)
VALUES (
  'YOUR_AUTH_USER_ID',
  'admin@lendtrack.com',
  'Admin User',
  'admin',
  0
);
```

Regular users:
- john@example.com (password: user123)
- sarah@example.com (password: user123)
- mike@example.com (password: user123)
- emma@example.com (password: user123)

For each user, after creating in Auth, run:
```sql
INSERT INTO users (id, email, full_name, role, outstanding_balance)
VALUES (
  'USER_AUTH_ID',
  'user@example.com',
  'User Name',
  'user',
  0
);
```

**Option 2: Create sample loans and payments**

Once users exist, you can add sample data:

```sql
-- Sample loans for john@example.com (replace user_id with actual ID)
INSERT INTO loans (user_id, amount, outstanding_amount, status, due_date, approved_at, interest_rate)
VALUES
  ('USER_ID', 5000.00, 3500.00, 'active', '2025-12-15', NOW(), 5.5),
  ('USER_ID', 2000.00, 2000.00, 'pending', NULL, NULL, 0);

-- Sample payment
INSERT INTO payments (loan_id, user_id, amount, transaction_id, status, processed_by)
VALUES
  ('LOAN_ID', 'USER_ID', 1500.00, 'TXN001', 'completed', 'ADMIN_ID');

-- Update outstanding balance
UPDATE users SET outstanding_balance = 3500.00 WHERE id = 'USER_ID';
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser to the URL shown in the terminal

3. Log in with one of your test accounts

### Testing Admin Features

1. Log in as a regular user first
2. Open the hamburger menu (top left)
3. Click "Admin" at the bottom of the menu
4. Sign out
5. Log in with admin credentials
6. Navigate back to Admin from the menu

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx
│   ├── Layout.tsx
│   ├── Login.tsx
│   └── Sidebar.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/               # Utilities and configuration
│   └── supabase.ts
├── pages/             # Page components
│   ├── AdminDashboard.tsx
│   ├── Dashboard.tsx
│   ├── Help.tsx
│   ├── History.tsx
│   └── LoanRequest.tsx
├── App.tsx            # Main app component
└── main.tsx          # Entry point
```

## Database Schema

### Tables
- `users` - User profiles with role-based access
- `loans` - Loan records with status tracking
- `payments` - Payment history and reversals
- `comments` - User messages and help requests

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Admins have full access to all records
- All policies enforce authentication

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Installing as PWA

1. Open the application in a mobile browser
2. Look for the "Add to Home Screen" prompt
3. Tap "Install" or "Add"
4. The app will be available as a standalone application

## Technology Stack

- React 18
- TypeScript
- Tailwind CSS
- Supabase (Database + Auth)
- Vite (Build tool)
- Lucide React (Icons)

## License

MIT
