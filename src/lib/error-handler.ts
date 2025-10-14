/**
 * Comprehensive Error Handler for Payout Processing
 * Handles various types of errors and provides retry logic
 */

export interface ErrorContext {
  payoutId?: string;
  orderId?: string;
  supplierId?: string;
  vendorId?: string;
  transferId?: string;
  operation?: string;
  timestamp?: Date;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export class PayoutError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly retryable: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    context: ErrorContext = {},
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'PayoutError';
    this.code = code;
    this.context = context;
    this.retryable = retryable;
    this.timestamp = new Date();
  }
}

export class PayoutErrorHandler {
  private static instance: PayoutErrorHandler;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'RATE_LIMIT_ERROR',
      'TEMPORARY_SERVICE_ERROR',
      'INSUFFICIENT_FUNDS_TEMPORARY',
      'ACCOUNT_TEMPORARILY_UNAVAILABLE'
    ]
  };

  public static getInstance(): PayoutErrorHandler {
    if (!PayoutErrorHandler.instance) {
      PayoutErrorHandler.instance = new PayoutErrorHandler();
    }
    return PayoutErrorHandler.instance;
  }

  /**
   * Handle Stripe API errors
   */
  handleStripeError(error: any, context: ErrorContext): PayoutError {
    const stripeError = error as any;
    
    switch (stripeError.type) {
      case 'StripeCardError':
        return new PayoutError(
          `Card error: ${stripeError.message}`,
          'CARD_ERROR',
          context,
          false
        );

      case 'StripeRateLimitError':
        return new PayoutError(
          `Rate limit exceeded: ${stripeError.message}`,
          'RATE_LIMIT_ERROR',
          context,
          true
        );

      case 'StripeInvalidRequestError':
        return new PayoutError(
          `Invalid request: ${stripeError.message}`,
          'INVALID_REQUEST_ERROR',
          context,
          false
        );

      case 'StripeAPIError':
        return new PayoutError(
          `API error: ${stripeError.message}`,
          'API_ERROR',
          context,
          true
        );

      case 'StripeConnectionError':
        return new PayoutError(
          `Connection error: ${stripeError.message}`,
          'NETWORK_ERROR',
          context,
          true
        );

      case 'StripeAuthenticationError':
        return new PayoutError(
          `Authentication error: ${stripeError.message}`,
          'AUTH_ERROR',
          context,
          false
        );

      default:
        return new PayoutError(
          `Unknown Stripe error: ${stripeError.message || 'Unknown error'}`,
          'UNKNOWN_STRIPE_ERROR',
          context,
          false
        );
    }
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error: any, context: ErrorContext): PayoutError {
    const dbError = error as any;
    
    if (dbError.code === 'P2002') {
      return new PayoutError(
        'Duplicate entry error',
        'DUPLICATE_ENTRY_ERROR',
        context,
        false
      );
    }

    if (dbError.code === 'P2025') {
      return new PayoutError(
        'Record not found',
        'RECORD_NOT_FOUND_ERROR',
        context,
        false
      );
    }

    if (dbError.code === 'P2003') {
      return new PayoutError(
        'Foreign key constraint error',
        'FOREIGN_KEY_ERROR',
        context,
        false
      );
    }

    return new PayoutError(
      `Database error: ${dbError.message || 'Unknown database error'}`,
      'DATABASE_ERROR',
      context,
      true
    );
  }

  /**
   * Handle validation errors
   */
  handleValidationError(error: any, context: ErrorContext): PayoutError {
    return new PayoutError(
      `Validation error: ${error.message || 'Invalid data'}`,
      'VALIDATION_ERROR',
      context,
      false
    );
  }

  /**
   * Handle business logic errors
   */
  handleBusinessError(message: string, code: string, context: ErrorContext): PayoutError {
    const retryableCodes = [
      'INSUFFICIENT_FUNDS_TEMPORARY',
      'ACCOUNT_TEMPORARILY_UNAVAILABLE',
      'PROCESSING_QUEUE_FULL'
    ];

    return new PayoutError(
      message,
      code,
      context,
      retryableCodes.includes(code)
    );
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: PayoutError): boolean {
    return error.retryable && this.retryConfig.retryableErrors.includes(error.code);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customRetryConfig };
    let lastError: PayoutError | null = null;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.categorizeError(error, context);
        
        if (!this.isRetryable(lastError) || attempt === config.maxRetries) {
          throw lastError;
        }

        const delay = this.calculateRetryDelay(attempt);
        console.log(`Retry attempt ${attempt}/${config.maxRetries} after ${delay}ms for ${context.operation || 'operation'}`);
        
        await this.delay(delay);
      }
    }

    throw lastError || new PayoutError('Max retries exceeded', 'MAX_RETRIES_EXCEEDED', context, false);
  }

  /**
   * Categorize and wrap error
   */
  categorizeError(error: any, context: ErrorContext): PayoutError {
    if (error instanceof PayoutError) {
      return error;
    }

    // Check if it's a Stripe error
    if (error.type && error.type.startsWith('Stripe')) {
      return this.handleStripeError(error, context);
    }

    // Check if it's a Prisma error
    if (error.code && error.code.startsWith('P')) {
      return this.handleDatabaseError(error, context);
    }

    // Check if it's a validation error
    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      return this.handleValidationError(error, context);
    }

    // Default to generic error
    return new PayoutError(
      error.message || 'Unknown error',
      'UNKNOWN_ERROR',
      context,
      false
    );
  }

  /**
   * Log error with context
   */
  logError(error: PayoutError, additionalContext?: any): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        retryable: error.retryable,
        timestamp: error.timestamp
      },
      context: error.context,
      additionalContext
    };

    if (error.retryable) {
      console.warn('Retryable error occurred:', logData);
    } else {
      console.error('Non-retryable error occurred:', logData);
    }
  }

  /**
   * Create error report for monitoring
   */
  createErrorReport(error: PayoutError): {
    id: string;
    timestamp: Date;
    error: {
      code: string;
      message: string;
      retryable: boolean;
    };
    context: ErrorContext;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    const severity = this.determineSeverity(error);
    
    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: error.timestamp,
      error: {
        code: error.code,
        message: error.message,
        retryable: error.retryable
      },
      context: error.context,
      severity
    };
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: PayoutError): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCodes = ['AUTH_ERROR', 'INVALID_REQUEST_ERROR', 'CARD_ERROR'];
    const highCodes = ['API_ERROR', 'DATABASE_ERROR', 'VALIDATION_ERROR'];
    const mediumCodes = ['RATE_LIMIT_ERROR', 'NETWORK_ERROR'];

    if (criticalCodes.includes(error.code)) {
      return 'critical';
    } else if (highCodes.includes(error.code)) {
      return 'high';
    } else if (mediumCodes.includes(error.code)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Get current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }
}

export const payoutErrorHandler = PayoutErrorHandler.getInstance();
