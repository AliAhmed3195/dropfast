# Stripe Requirements Check & Resend Link System

## 🎯 Overview

This document explains the Stripe requirements check and resend link functionality that allows admins to monitor user account requirements and send new onboarding links.

## 📋 Features

### **1. Requirements Check**
- Check Stripe account requirements for any user
- View missing, past due, and eventually due fields
- Real-time status updates
- Detailed field mapping to human-readable names

### **2. Resend Onboarding Links**
- Generate new onboarding links for existing accounts
- Send email notifications to users
- Support for both Express and Connect accounts
- Track link sending history

### **3. Admin Panel Integration**
- Requirements check button in user actions
- Detailed requirements modal
- Status indicators and progress tracking
- Email sending capabilities

---

## 🔧 API Endpoints

### **1. Check Requirements**
```
GET /api/admin/users/[id]/stripe-requirements
```

**Response:**
```json
{
  "success": true,
  "requirements": {
    "currentlyDue": ["First Name", "Last Name"],
    "pastDue": ["Government ID"],
    "eventuallyDue": ["Business Website"],
    "accountStatus": "pending"
  },
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### **2. Resend Onboarding Link**
```
POST /api/admin/users/[id]/resend-onboarding-link
```

**Request Body:**
```json
{
  "linkType": "express" // or "connect"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding link sent successfully",
  "data": {
    "userId": "user_id",
    "userEmail": "user@example.com",
    "onboardingLink": "https://connect.stripe.com/...",
    "emailSent": true
  }
}
```

---

## 🎨 UI Components

### **1. Requirements Check Button**
- Blue clipboard icon in admin user actions
- Triggers requirements check modal
- Shows loading state during check

### **2. Requirements Modal**
- **User Information**: Name and email display
- **Account Status**: Current verification status with color coding
- **Missing Requirements**: 
  - Past Due (Red) - Urgent items
  - Currently Due (Yellow) - Required items
  - Eventually Due (Blue) - Future requirements
- **Resend Link Section**: 
  - Link type selection (Express/Connect)
  - Send button with loading state
  - Success/error feedback

### **3. Status Indicators**
- ✅ **Verified**: All requirements met
- ⏳ **Pending**: Missing some requirements
- ⚠️ **Restricted**: Past due requirements
- ❌ **Rejected**: Account issues

---

## 📊 Database Schema

### **New Fields Added to Business Model:**
```prisma
model Business {
  // Requirements tracking
  stripeRequirements      Json?            // Store requirements object
  stripeMissingFields     Json?            // Store missing fields array
  stripeLastRequirementsCheck DateTime?    // Last check timestamp
  stripeOnboardingLinksSent Int?           // Count of links sent
}
```

---

## 🔄 Field Mapping

### **Stripe Field → Human Readable**
```typescript
const fieldMapping = {
  'individual.first_name': 'First Name',
  'individual.last_name': 'Last Name',
  'individual.email': 'Email Address',
  'individual.phone': 'Phone Number',
  'individual.dob.day': 'Date of Birth (Day)',
  'individual.address.line1': 'Address Line 1',
  'individual.id_number': 'Government ID Number',
  'individual.verification.document': 'Government ID Document',
  'external_account': 'Bank Account Information',
  'tos_acceptance.date': 'Terms of Service Acceptance',
  'business_profile.url': 'Business Website',
  'company.name': 'Company Name',
  'company.tax_id': 'Company Tax ID'
  // ... more fields
};
```

---

## 📧 Email Templates

### **Requirements Email Template**
- **Subject**: "Action Required: Complete Your Stripe Account Setup"
- **Content**:
  - Personalized greeting
  - Status badge (Pending/Restricted)
  - List of missing requirements
  - Call-to-action button
  - Important notes (24-hour expiry)
  - Professional styling

### **Email Features**:
- Responsive HTML design
- Color-coded status indicators
- Clear action buttons
- Professional branding
- Mobile-friendly layout

---

## 🚀 Usage Flow

### **1. Admin Checks Requirements**
1. Admin clicks "Check Requirements" button
2. System fetches requirements from Stripe
3. Modal displays detailed requirements
4. Admin can see what's missing

### **2. Admin Resends Link**
1. Admin selects link type (Express/Connect)
2. System generates new onboarding link
3. Email sent to user automatically
4. Success confirmation shown

### **3. User Receives Email**
1. User gets email with missing requirements
2. Clicks onboarding link
3. Completes missing information
4. Account status updates automatically

---

## 🧪 Testing

### **1. Test Requirements Check**
```bash
# Test with existing user
curl -X GET "http://localhost:3000/api/admin/users/[user_id]/stripe-requirements"
```

### **2. Test Resend Link**
```bash
# Test resend functionality
curl -X POST "http://localhost:3000/api/admin/users/[user_id]/resend-onboarding-link" \
  -H "Content-Type: application/json" \
  -d '{"linkType": "express"}'
```

### **3. Test Email Sending**
- Check email service configuration
- Verify email templates render correctly
- Test with different requirement scenarios

---

## 🔍 Monitoring

### **1. Database Tracking**
- `stripeLastRequirementsCheck`: Track when requirements were last checked
- `stripeOnboardingLinksSent`: Count of links sent to user
- `stripeMissingFields`: Store current missing fields

### **2. Error Handling**
- Invalid account IDs
- Missing user data
- Email sending failures
- Stripe API errors

### **3. Logging**
- Requirements check attempts
- Link generation success/failure
- Email sending status
- User interactions

---

## 🛠️ Troubleshooting

### **1. Requirements Not Loading**
- Check Stripe account ID exists
- Verify Stripe API credentials
- Check network connectivity
- Review error logs

### **2. Email Not Sending**
- Verify email service configuration
- Check SMTP settings
- Test email templates
- Review email service logs

### **3. Modal Not Opening**
- Check JavaScript console for errors
- Verify component imports
- Check state management
- Review API responses

---

## 📚 Additional Resources

- [Stripe Connect Requirements](https://stripe.com/docs/connect/required-verification-information)
- [Stripe Account Links](https://stripe.com/docs/connect/account-links)
- [Email Service Documentation](./EMAIL_SETUP.md)
- [Webhook Integration](./WEBHOOK_SETUP.md)

---

## 🎉 Success Criteria

✅ Requirements check works for all account types
✅ Missing fields display correctly
✅ Resend link generates new URLs
✅ Emails send successfully
✅ Modal displays all information
✅ Database updates properly
✅ Error handling works correctly
✅ Admin can monitor all users

---

## 🚀 Future Enhancements

### **Planned Features:**
- Bulk requirements check
- Requirements history tracking
- Automated requirement reminders
- Advanced email templates
- Requirements analytics dashboard
- Integration with webhook system

### **Potential Improvements:**
- Real-time requirements updates
- Custom requirement categories
- Multi-language support
- Advanced filtering options
- Export requirements data
- Integration with CRM systems
