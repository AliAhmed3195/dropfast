import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email-service';

// Validate Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('⚠️ STRIPE_SECRET_KEY is not set in environment variables');
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover' as any,
});

export class StripeRequirementsService {
  /**
   * Field mapping for Stripe requirements to human-readable names
   */
  private fieldMapping: Record<string, string> = {
    'individual.first_name': 'First Name',
    'individual.last_name': 'Last Name',
    'individual.email': 'Email Address',
    'individual.phone': 'Phone Number',
    'individual.dob.day': 'Date of Birth (Day)',
    'individual.dob.month': 'Date of Birth (Month)',
    'individual.dob.year': 'Date of Birth (Year)',
    'individual.address.line1': 'Address Line 1',
    'individual.address.city': 'City',
    'individual.address.state': 'State/Province',
    'individual.address.postal_code': 'Postal Code',
    'individual.id_number': 'Government ID Number',
    'individual.verification.document': 'Government ID Document',
    'individual.verification.additional_document': 'Additional Verification Document',
    'external_account': 'Bank Account Information',
    'tos_acceptance.date': 'Terms of Service Acceptance',
    'tos_acceptance.ip': 'Terms of Service IP',
    'business_profile.mcc': 'Merchant Category Code',
    'business_profile.url': 'Business Website',
    'business_profile.product_description': 'Product Description',
    'company.name': 'Company Name',
    'company.address.line1': 'Company Address',
    'company.address.city': 'Company City',
    'company.address.state': 'Company State',
    'company.address.postal_code': 'Company Postal Code',
    'company.tax_id': 'Company Tax ID',
    'company.verification.document': 'Company Verification Document'
  };

  /**
   * Get account requirements from Stripe
   */
  async getAccountRequirements(accountId: string): Promise<{
    currentlyDue: string[];
    pastDue: string[];
    eventuallyDue: string[];
    disabledReason?: string;
    accountStatus: string;
  }> {
    try {
      const account = await stripe.accounts.retrieve(accountId);
      
      const requirements = (account.requirements || {}) as any;
      const currentlyDue = requirements.currently_due || [];
      const pastDue = requirements.past_due || [];
      const eventuallyDue = requirements.eventually_due || [];
      
      return {
        currentlyDue: this.mapFieldsToReadable(currentlyDue),
        pastDue: this.mapFieldsToReadable(pastDue),
        eventuallyDue: this.mapFieldsToReadable(eventuallyDue),
        disabledReason: requirements.disabled_reason,
        accountStatus: this.determineAccountStatus(account)
      };
    } catch (error) {
      console.error('Error fetching account requirements:', error);
      throw new Error(`Failed to fetch requirements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate new onboarding link for existing account
   */
  async generateOnboardingLink(accountId: string): Promise<string> {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${this.getBaseUrl()}/dashboard/onboarding?refresh=true`,
        return_url: `${this.getBaseUrl()}/dashboard/onboarding?success=true`,
        type: 'account_onboarding'
      });

      console.log(`New onboarding link generated for account: ${accountId}`);
      return accountLink.url;
    } catch (error) {
      console.error('Error generating onboarding link:', error);
      throw new Error(`Failed to generate onboarding link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send requirements email to user
   */
  async sendRequirementsEmail(
    user: { id: string; name: string; email: string },
    missingFields: string[],
    onboardingLink: string,
    accountStatus: string
  ): Promise<void> {
    try {
      const subject = 'Action Required: Complete Your Stripe Account Setup';
      const html = this.generateRequirementsEmailHTML(
        user.name,
        missingFields,
        onboardingLink,
        accountStatus
      );

      await emailService.sendEmail({ to: user.email, subject, html });
      console.log(`Requirements email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending requirements email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check requirements and send email if needed
   */
  async checkAndNotifyRequirements(userId: string): Promise<{
    requirements: any;
    emailSent: boolean;
    onboardingLink?: string;
  }> {
    try {
      // Get user with business info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { business: true }
      });

      // Check if user has any Stripe account (Express or Connect)
      const accountId = user?.business?.expressAccountId || user?.business?.stripeAccountId;
      
      if (!user || !accountId) {
        throw new Error('User or Stripe account not found');
      }

      // Get requirements
      const requirements = await this.getAccountRequirements(accountId);
      
      // Check if there are missing requirements
      const hasMissingRequirements = requirements.currentlyDue.length > 0 || requirements.pastDue.length > 0;
      
      let emailSent = false;
      let onboardingLink: string | undefined;

      if (hasMissingRequirements) {
        // Generate new onboarding link
        onboardingLink = await this.generateOnboardingLink(accountId);
        
        // Send email
        await this.sendRequirementsEmail(
          user,
          [...requirements.currentlyDue, ...requirements.pastDue],
          onboardingLink,
          requirements.accountStatus
        );
        
        emailSent = true;
      }

      // Update database with requirements info
      await prisma.business.update({
        where: { id: user.business.id },
        data: {
          stripeRequirements: requirements,
          stripeMissingFields: [...requirements.currentlyDue, ...requirements.pastDue],
          stripeLastRequirementsCheck: new Date()
        }
      });

      return {
        requirements,
        emailSent,
        onboardingLink
      };
    } catch (error) {
      console.error('Error checking and notifying requirements:', error);
      throw error;
    }
  }

  /**
   * Map Stripe field names to human-readable names
   */
  private mapFieldsToReadable(fields: string[]): string[] {
    return fields.map(field => this.fieldMapping[field] || field);
  }

  /**
   * Determine account status based on requirements
   */
  private determineAccountStatus(account: Stripe.Account): string {
    if (account.requirements?.past_due?.length > 0) {
      return 'restricted';
    }
    
    if (account.requirements?.currently_due?.length > 0) {
      return 'pending';
    }
    
    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
      return 'verified';
    }
    
    return 'pending';
  }

  /**
   * Generate HTML email template for requirements
   */
  private generateRequirementsEmailHTML(
    userName: string,
    missingFields: string[],
    onboardingLink: string,
    accountStatus: string
  ): string {
    const statusColor = accountStatus === 'restricted' ? '#dc3545' : '#ffc107';
    const statusText = accountStatus === 'restricted' ? 'Restricted' : 'Pending';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your Stripe Account Setup</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .status-badge { 
            display: inline-block; 
            padding: 8px 16px; 
            background: ${statusColor}; 
            color: white; 
            border-radius: 4px; 
            font-weight: bold; 
            margin: 10px 0;
          }
          .requirements-list { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .requirement-item { 
            display: flex; 
            align-items: center; 
            margin: 10px 0; 
            padding: 8px; 
            background: white; 
            border-radius: 4px; 
            border-left: 4px solid #dc3545;
          }
          .requirement-icon { margin-right: 10px; font-size: 18px; }
          .cta-button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            font-weight: bold; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Complete Your Stripe Account Setup</h1>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Your Stripe account setup is almost complete! Please provide the following missing information to continue processing payments.</p>
            <div class="status-badge">Status: ${statusText}</div>
          </div>
          
          <div class="requirements-list">
            <h3>📋 Missing Information Required:</h3>
            ${missingFields.map(field => `
              <div class="requirement-item">
                <span class="requirement-icon">❌</span>
                <span>${field}</span>
              </div>
            `).join('')}
          </div>
          
          <div style="text-align: center;">
            <a href="${onboardingLink}" class="cta-button">Complete Your Setup Now</a>
          </div>
          
          <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4>⏰ Important:</h4>
            <ul>
              <li>This link will expire in <strong>24 hours</strong></li>
              <li>Complete all required fields to activate your account</li>
              <li>You'll receive a confirmation email once setup is complete</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The FastDrop Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get base URL for redirects
   */
  private getBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      return process.env.NEXT_PUBLIC_BASE_URL;
    }
    
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000';
    }
    
    return 'https://fastdrop.com';
  }
}

export const stripeRequirementsService = new StripeRequirementsService();
