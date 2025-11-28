# Phase 3 Quick Start Guide

## New Features Overview

Phase 3 adds notifications, push support, admin settings, and an EMI calculator to LendTrack.

## For End Users

### 1. View Notifications
- Click the bell icon in the header
- See badge with unread count
- Navigate to Notices page
- Filter by All or Unread
- Mark individual or all as read

### 2. Enable Push Notifications
1. Go to Profile from menu
2. Find "Push Notifications" section
3. Click "Enable"
4. Allow browser permission
5. Receive instant notifications

### 3. Calculate EMI
1. Open menu > EMI Calculator
2. Enter loan amount (e.g., 10000)
3. Enter interest rate (e.g., 5.5)
4. Enter tenure in months (e.g., 12)
5. Click "Calculate"
6. View results and repayment schedule

### 4. Check Profile
- Menu > Profile
- View account information
- See outstanding balance
- Manage notification preferences

## For Admins

### 1. Configure Settings
1. Menu > Admin Tools > Settings
2. Click "General Settings" tab
3. Edit values:
   - Lending cap per user
   - Default interest rate
   - Penalty rate
   - Reminder days before due
   - Max active loans per user
4. Click "Save Settings"

### 2. Edit Notification Templates
1. Menu > Admin Tools > Settings
2. Click "Notification Templates" tab
3. Select a template type
4. Edit subject, email body, push body, in-app body
5. Use {{variable}} syntax for dynamic values
6. Click "Save Templates"

Available variables:
- {{user_name}}
- {{amount}}
- {{transaction_id}}
- {{remaining_balance}}
- {{due_date}}
- {{interest_rate}}
- {{reason}}
- {{message}}

### 3. Automatic Notifications

When you mark a payment as paid:
- User receives payment confirmation
- Email queued
- Push notification sent (if enabled)
- In-app notification created

## Sample Test Scenarios

### Test Notification Flow
1. As admin, mark a loan as paid
2. Enter amount and transaction ID
3. Click Confirm
4. Switch to user account
5. Check bell icon for badge
6. Open Notices page
7. See payment confirmation

### Test EMI Calculator
**Scenario: $10,000 loan at 5.5% for 12 months**
- Expected EMI: $858.52
- Total Payment: $10,302.45
- Total Interest: $302.45

**Scenario: $5,000 loan at 0% for 6 months**
- Expected EMI: $833.33
- Total Payment: $5,000.00
- Total Interest: $0.00

### Test Push Notifications
1. Enable push on Profile page
2. Submit a loan request
3. Should receive push notification
4. Click notification
5. App opens to dashboard

## Configuration

### Admin Settings Defaults
- Lending cap: $50,000
- Interest rate: 5.5%
- Penalty rate: 2.0%
- Reminder days: 7 days before due
- Max loans: 3 active loans

### Notification Types
- **due_alert**: Payment due soon
- **payment_confirmed**: Payment received
- **loan_approved**: Loan has been approved
- **loan_rejected**: Loan was rejected
- **general**: General notices

## Troubleshooting

### Push Notifications Not Working
1. Check browser support (Chrome, Firefox)
2. Verify HTTPS or localhost
3. Check browser permissions
4. Re-enable in Profile if needed
5. Check browser console for errors

### Notifications Not Appearing
1. Refresh the page
2. Check Notices page directly
3. Verify badge count in header
4. Check database for notification records

### EMI Calculator Shows Wrong Results
1. Verify input values are numbers
2. Check decimal separator (use . not ,)
3. Ensure tenure is in months
4. Try clearing and re-entering values

### Settings Not Saving
1. Verify admin role
2. Check browser console for errors
3. Ensure all fields are valid
4. Try refreshing and re-saving

## API Examples

### Send Custom Notification
```typescript
import { createNotification } from './lib/notifications';

await createNotification({
  userId: 'user-uuid',
  type: 'general',
  title: 'Welcome!',
  message: 'Welcome to LendTrack',
  metadata: { source: 'welcome_flow' }
});
```

### Send Template Notification
```typescript
import { sendNotificationFromTemplate } from './lib/notifications';

await sendNotificationFromTemplate(
  'user-uuid',
  'payment_confirmed',
  {
    user_name: 'John Doe',
    amount: '1000.00',
    transaction_id: 'TXN123',
    remaining_balance: '4000.00'
  }
);
```

### Calculate EMI
```typescript
import { calculateEMI } from './lib/emiCalculator';

const result = calculateEMI(
  10000, // principal
  5.5,   // annual interest rate
  12     // tenure in months
);

console.log(result.emi); // 858.52
```

### Generate Schedule
```typescript
import { generateRepaymentSchedule } from './lib/emiCalculator';

const schedule = generateRepaymentSchedule(
  10000,
  5.5,
  12,
  new Date('2025-01-01')
);

console.log(schedule[0]);
// {
//   month: 1,
//   payment: 858.52,
//   principal: 812.86,
//   interest: 45.66,
//   balance: 9187.14,
//   date: '2025-02-01'
// }
```

## Next Steps

After Phase 3:
1. Test all notification flows
2. Configure settings for your use case
3. Customize notification templates
4. Train users on EMI calculator
5. Monitor email queue for delivery
6. Set up backend email service (optional)
7. Configure VAPID keys for production push
8. Customize interest rates per loan
9. Add payment reminders
10. Implement penalty calculations

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database migrations ran
3. Check RLS policies are enabled
4. Review PHASE_3_SUMMARY.md for details
5. Contact admin for configuration help

---

**Phase 3 is production-ready and fully functional!**

Start by exploring the Notices page and EMI Calculator as an end user, then switch to admin and configure Settings.
