# 📧 Email Setup for Express Stripe Onboarding

## Overview
This system automatically sends onboarding emails to vendor and supplier users when admin creates Express Stripe accounts.

## Email Configuration

### Environment Variables
Add these to your `.env.local` file:

```env
# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="FastDrop Admin <admin@fastdrop.com>"
```

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

3. **Update Environment Variables**:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-gmail@gmail.com"
   SMTP_PASS="your-16-character-app-password"
   SMTP_FROM="FastDrop Admin <your-gmail@gmail.com>"
   ```

### Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
```

#### Yahoo
```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_USER="your-email@yahoo.com"
SMTP_PASS="your-app-password"
```

#### Custom SMTP
```env
SMTP_HOST="your-smtp-server.com"
SMTP_PORT="587"
SMTP_USER="your-username"
SMTP_PASS="your-password"
```

## How It Works

### 1. Admin Creates Express Account
- Admin clicks purple "+" button for vendor/supplier
- System creates Express Stripe account
- Admin gets confirmation dialog with email option

### 2. Email Sending Options
- **Send Email**: Automatically sends onboarding link to user
- **Manual Share**: Admin can copy link and share manually

### 3. User Receives Email
- Professional HTML email with onboarding instructions
- Direct link to complete Stripe onboarding
- Country-specific information and requirements

### 4. User Completes Onboarding
- User clicks email link
- Completes Stripe onboarding process
- Admin can monitor status in admin panel

## Email Template Features

### Professional Design
- Responsive HTML layout
- FastDrop branding
- Clear call-to-action button

### User-Specific Content
- Personalized greeting with user name
- Role-specific instructions (Vendor/Supplier)
- Country-specific information
- Business requirements

### Important Information
- Link expiration (24 hours)
- Required documents
- Support contact information
- Fallback text version

## Admin Panel Features

### Express Account Management
- **Purple "+" Button**: Create Express account + send email
- **Green Link Button**: Generate new link + send email
- **Blue Email Button**: Send onboarding email directly
- **Orange Check Button**: Check account status

### Email Confirmation
- Success/failure notifications
- User email address confirmation
- Manual sharing fallback option

## Testing Email Setup

### 1. Test Email Service
```bash
# Add to your test script
const emailService = require('./src/lib/email-service');
await emailService.sendOnboardingEmail(
  'test@example.com',
  'Test User',
  'VENDOR_USER',
  'https://connect.stripe.com/express/onboarding/...',
  'US'
);
```

### 2. Check Email Logs
- Monitor console for email sending errors
- Check spam folder for test emails
- Verify SMTP credentials

## Troubleshooting

### Common Issues

#### "Authentication failed"
- Check SMTP credentials
- Verify app password (not regular password)
- Ensure 2FA is enabled for Gmail

#### "Connection timeout"
- Check SMTP_HOST and SMTP_PORT
- Verify firewall settings
- Try different port (465 for SSL)

#### "Email not received"
- Check spam folder
- Verify recipient email address
- Check email service logs

### Debug Mode
Add to your environment:
```env
NODE_ENV="development"
```

This will show detailed email sending logs.

## Security Notes

- Never commit email credentials to version control
- Use app passwords instead of regular passwords
- Rotate credentials regularly
- Monitor email sending logs

## Support

If you need help with email setup:
1. Check the troubleshooting section
2. Verify environment variables
3. Test with a simple email first
4. Contact support with error logs
