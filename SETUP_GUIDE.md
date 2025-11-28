# Quick Setup Guide

## Step 1: Create Admin User

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Invite User" or "Add User"
3. Create user with:
   - Email: `admin@lendtrack.com`
   - Password: `admin123` (or your choice)
   - Auto Confirm: Yes

4. Copy the User ID from the table

5. Go to SQL Editor and run:
```sql
INSERT INTO users (id, email, full_name, role, outstanding_balance)
VALUES (
  'PASTE_USER_ID_HERE',
  'admin@lendtrack.com',
  'Admin User',
  'admin',
  0
);
```

## Step 2: Create Test Users

Repeat the process for regular users:

**User 1:**
- Email: john@example.com
- Password: user123
```sql
INSERT INTO users (id, email, full_name, role, outstanding_balance)
VALUES ('USER_ID', 'john@example.com', 'John Doe', 'user', 5000.00);
```

**User 2:**
- Email: sarah@example.com
- Password: user123
```sql
INSERT INTO users (id, email, full_name, role, outstanding_balance)
VALUES ('USER_ID', 'sarah@example.com', 'Sarah Smith', 'user', 2500.00);
```

**User 3:**
- Email: mike@example.com
- Password: user123
```sql
INSERT INTO users (id, email, full_name, role, outstanding_balance)
VALUES ('USER_ID', 'mike@example.com', 'Mike Johnson', 'user', 0);
```

**User 4:**
- Email: emma@example.com
- Password: user123
```sql
INSERT INTO users (id, email, full_name, role, outstanding_balance)
VALUES ('USER_ID', 'emma@example.com', 'Emma Wilson', 'user', 3200.00);
```

## Step 3: Create Sample Loans

After creating users, add sample loans using their actual user IDs:

```sql
-- For John (replace USER_ID with John's actual ID)
INSERT INTO loans (user_id, amount, outstanding_amount, status, due_date, approved_at, interest_rate)
VALUES
  ('JOHN_USER_ID', 5000.00, 5000.00, 'active', '2025-12-31', NOW(), 5.5),
  ('JOHN_USER_ID', 2000.00, 0, 'completed', '2024-06-30', NOW(), 5.0);

-- For Sarah
INSERT INTO loans (user_id, amount, outstanding_amount, status, due_date, approved_at, interest_rate)
VALUES
  ('SARAH_USER_ID', 3000.00, 2500.00, 'active', '2025-11-15', NOW(), 6.0),
  ('SARAH_USER_ID', 1500.00, 1500.00, 'pending', NULL, NULL, 0);

-- For Mike
INSERT INTO loans (user_id, amount, outstanding_amount, status, due_date)
VALUES
  ('MIKE_USER_ID', 1000.00, 1000.00, 'pending', NULL);

-- For Emma
INSERT INTO loans (user_id, amount, outstanding_amount, status, due_date, approved_at, interest_rate)
VALUES
  ('EMMA_USER_ID', 4000.00, 3200.00, 'active', '2026-01-20', NOW(), 5.75),
  ('EMMA_USER_ID', 1500.00, 0, 'completed', '2024-08-15', NOW(), 5.5);
```

## Step 4: Add Sample Payments

```sql
-- Get loan IDs first
SELECT id, user_id, amount FROM loans WHERE status = 'active' LIMIT 3;

-- Add payments (replace IDs with actual values)
INSERT INTO payments (loan_id, user_id, amount, transaction_id, status, processed_by)
VALUES
  ('LOAN_ID_1', 'USER_ID_1', 500.00, 'TXN001', 'completed', 'ADMIN_ID'),
  ('LOAN_ID_2', 'USER_ID_2', 800.00, 'TXN002', 'completed', 'ADMIN_ID'),
  ('LOAN_ID_3', 'USER_ID_3', 1200.00, 'TXN003', 'completed', 'ADMIN_ID');
```

## Step 5: Test the Application

1. Start the dev server: `npm run dev`
2. Log in as a regular user (e.g., john@example.com / user123)
3. View dashboard, request a loan, check history
4. Log out
5. Open hamburger menu > Admin
6. Log in as admin (admin@lendtrack.com / admin123)
7. Test the Paid and Unpaid actions

## Quick SQL - All in One

Here's a complete script (replace all IDs with actual values):

```sql
-- After creating 5 auth users, run this:
INSERT INTO users (id, email, full_name, role, outstanding_balance) VALUES
  ('ADMIN_ID', 'admin@lendtrack.com', 'Admin User', 'admin', 0),
  ('JOHN_ID', 'john@example.com', 'John Doe', 'user', 5000.00),
  ('SARAH_ID', 'sarah@example.com', 'Sarah Smith', 'user', 2500.00),
  ('MIKE_ID', 'mike@example.com', 'Mike Johnson', 'user', 0),
  ('EMMA_ID', 'emma@example.com', 'Emma Wilson', 'user', 3200.00);

-- Then create loans
INSERT INTO loans (user_id, amount, outstanding_amount, status, due_date, approved_at, interest_rate) VALUES
  ('JOHN_ID', 5000.00, 5000.00, 'active', '2025-12-31', NOW(), 5.5),
  ('JOHN_ID', 2000.00, 0, 'completed', '2024-06-30', NOW(), 5.0),
  ('SARAH_ID', 3000.00, 2500.00, 'active', '2025-11-15', NOW(), 6.0),
  ('SARAH_ID', 1500.00, 1500.00, 'pending', NULL, NULL, 0),
  ('MIKE_ID', 1000.00, 1000.00, 'pending', NULL, NULL, 0),
  ('EMMA_ID', 4000.00, 3200.00, 'active', '2026-01-20', NOW(), 5.75),
  ('EMMA_ID', 1500.00, 0, 'completed', '2024-08-15', NOW(), 5.5);
```

## Troubleshooting

**Can't log in?**
- Check that the user exists in both auth.users AND users tables
- Verify the password is correct

**Admin access denied?**
- Make sure the user's role is set to 'admin' in the users table

**No loans showing?**
- Check that loans.user_id matches the logged-in user's ID
- Verify RLS policies are enabled

**PWA not installing?**
- Ensure you're using HTTPS (or localhost)
- Check browser console for service worker errors
- Add actual icon images (icon-192.png and icon-512.png)
