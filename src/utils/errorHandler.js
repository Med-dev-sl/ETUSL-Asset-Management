import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Error types for consistent error handling
export const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  DATABASE: 'DATABASE_ERROR',
  NETWORK: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Error messages for consistent user feedback
export const ErrorMessages = {
  [ErrorTypes.VALIDATION]: 'Please check the form and try again.',
  [ErrorTypes.AUTHENTICATION]: 'You must be logged in to perform this action.',
  [ErrorTypes.PERMISSION]: 'You do not have permission to perform this action.',
  [ErrorTypes.DATABASE]: 'There was a problem accessing the database.',
  [ErrorTypes.NETWORK]: 'Please check your internet connection.',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred.'
};

// Custom error class
export class AppError extends Error {
  constructor(type, message, originalError = null) {
    super(message || ErrorMessages[type]);
    this.type = type;
    this.originalError = originalError;
    this.timestamp = new Date();
  }
}

// Error handler function
export const handleError = async (error, context = {}) => {
  let appError;
  
  if (error instanceof AppError) {
    appError = error;
  } else {
    // Map common Firebase errors to our error types
    if (error.code === 'permission-denied') {
      appError = new AppError(ErrorTypes.PERMISSION, null, error);
    } else if (error.code === 'unauthenticated') {
      appError = new AppError(ErrorTypes.AUTHENTICATION, null, error);
    } else if (error.code?.includes('network')) {
      appError = new AppError(ErrorTypes.NETWORK, null, error);
    } else {
      appError = new AppError(ErrorTypes.UNKNOWN, null, error);
    }
  }

  // Log error to console
  console.error('Application error:', {
    type: appError.type,
    message: appError.message,
    context,
    originalError: appError.originalError,
    timestamp: appError.timestamp
  });

  try {
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));

    // Log error to Firestore
    await addDoc(collection(db, 'errorLogs'), {
      type: appError.type,
      message: appError.message,
      context,
      originalError: appError.originalError ? {
        message: appError.originalError.message,
        stack: appError.originalError.stack,
        code: appError.originalError.code
      } : null,
      userId: user?.id || null,
      userEmail: user?.email || null,
      timestamp: serverTimestamp()
    });
  } catch (logError) {
    // If error logging fails, just console log it
    console.error('Failed to log error:', logError);
  }

  return {
    type: appError.type,
    message: appError.message,
    isError: true
  };
};

// Success handler function
export const handleSuccess = async (action, details) => {
  try {
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      throw new AppError(ErrorTypes.AUTHENTICATION);
    }

    // Log successful action to audit log
    await addDoc(collection(db, 'auditLogs'), {
      action,
      details,
      userId: user.id,
      userEmail: user.email,
      timestamp: serverTimestamp(),
      status: 'success'
    });

    return {
      success: true,
      message: 'Operation completed successfully'
    };
  } catch (error) {
    return handleError(error, { action, details });
  }
};
