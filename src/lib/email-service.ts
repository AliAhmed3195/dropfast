import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendOnboardingEmail(
    userEmail: string,
    userName: string,
    userRole: 'VENDOR_USER' | 'SUPPLIER_USER',
    onboardingLink: string,
    businessCountry: string
  ): Promise<boolean> {
    const roleText = userRole === 'VENDOR_USER' ? 'Vendor' : 'Supplier';
    const subject = `Complete Your ${roleText} Onboarding - FastDrop`;

    const html = this.generateOnboardingEmailHTML(
      userName,
      roleText,
      onboardingLink,
      businessCountry
    );

    const text = this.generateOnboardingEmailText(
      userName,
      roleText,
      onboardingLink,
      businessCountry
    );

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      text,
    });
  }

  private generateOnboardingEmailHTML(
    userName: string,
    roleText: string,
    onboardingLink: string,
    businessCountry: string
  ): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Complete Your ${roleText} Onboarding</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #45a049; }
        .info-box { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .country-info { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Welcome to FastDrop!</h1>
          <p>Complete Your ${roleText} Onboarding</p>
        </div>
        
        <div class="content">
          <h2>Hello ${userName}!</h2>
          
          <p>Your ${roleText} account has been created successfully. To start receiving payments and managing your business, you need to complete your Stripe onboarding process.</p>
          
          <div class="info-box">
            <h3>📋 What You Need to Do:</h3>
            <ol>
              <li>Click the onboarding link below</li>
              <li>Complete your business information</li>
              <li>Add your bank account details</li>
              <li>Verify your identity (if required)</li>
            </ol>
          </div>
          
          <div class="country-info">
            <h3>🌍 Country Information:</h3>
            <p><strong>Your Business Country:</strong> ${businessCountry}</p>
            <p>Based on your country, you'll see specific requirements and capabilities during onboarding.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${onboardingLink}" class="button">Complete Onboarding Now</a>
          </div>
          
          <div class="info-box">
            <h3>⚠️ Important Notes:</h3>
            <ul>
              <li>This link expires in 24 hours</li>
              <li>You'll need your business documents ready</li>
              <li>Bank account information is required</li>
              <li>Contact support if you need help</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace;">${onboardingLink}</p>
        </div>
        
        <div class="footer">
          <p>This email was sent by FastDrop Admin</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  private generateOnboardingEmailText(
    userName: string,
    roleText: string,
    onboardingLink: string,
    businessCountry: string
  ): string {
    return `
Welcome to FastDrop!

Hello ${userName}!

Your ${roleText} account has been created successfully. To start receiving payments and managing your business, you need to complete your Stripe onboarding process.

What You Need to Do:
1. Click the onboarding link below
2. Complete your business information
3. Add your bank account details
4. Verify your identity (if required)

Country Information:
Your Business Country: ${businessCountry}
Based on your country, you'll see specific requirements and capabilities during onboarding.

Complete Onboarding: ${onboardingLink}

Important Notes:
- This link expires in 24 hours
- You'll need your business documents ready
- Bank account information is required
- Contact support if you need help

If you have any questions, please contact our support team.

This email was sent by FastDrop Admin
    `;
  }
}

export const emailService = new EmailService();
