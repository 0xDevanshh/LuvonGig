'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { z } from 'zod';
import { 
  signupSchema, 
  loginSchema, 
  otpVerificationSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from '../validations';
import { 
  hashPassword, 
  verifyPassword, 
  createSession, 
  getSession, 
  clearSession,
  createPasswordResetToken,
  verifyPasswordResetToken,
  generateOTP,
  generateUserId,
  isValidEmail
} from '../auth';
import { getUserActor } from '../ic-agent';
import emailService from '../email';
import { 
  checkOTPRateLimit, 
  checkOTPVerificationRateLimit, 
  checkLoginRateLimit,
  checkPasswordResetRateLimit,
  resetOTPRateLimit,
  resetOTPVerificationRateLimit,
  resetLoginRateLimit
} from '../rate-limit';

// Get client IP for rate limiting
async function getClientIP(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const realIP = headersList.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

// Signup action
export async function signupAction(formData: FormData) {
  try {
    // Debug: Log all form data entries
    console.log('Form data entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const rawData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    // Validate input
    const validatedData = signupSchema.parse(rawData);

    // Check rate limiting
    const ip = await getClientIP();
    const rateLimit = checkOTPRateLimit(validatedData.email);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Too many OTP requests. Try again in ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} minutes.`,
      };
    }

    // Check if user already exists
    const userActor = await getUserActor();
    const existingUser = await userActor.getUserByEmail(validatedData.email);
    
    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists',
      };
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const result = await userActor.createUser(validatedData.email, passwordHash);
    
    if ('err' in result) {
      return {
        success: false,
        error: result.err,
      };
    }

    const userId = result.ok;

    // Generate and send OTP
    const otp = generateOTP();
    const otpResult = await userActor.createOTP(validatedData.email);
    
    if ('err' in otpResult) {
      return {
        success: false,
        error: 'Failed to create OTP. Please try again.',
      };
    }

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(
      validatedData.email,
      otpResult.ok,
      `${validatedData.firstName} ${validatedData.lastName}`
    );

    if (!emailSent) {
      return {
        success: false,
        error: 'Failed to send verification email. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Account created successfully. Please check your email for verification code.',
      userId,
    };
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Login action
export async function loginAction(formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    // Validate input
    const validatedData = loginSchema.parse(rawData);

    // Check rate limiting
    const ip = await getClientIP();
    const rateLimit = checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Too many login attempts. Try again in ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} minutes.`,
      };
    }

    // Get user
    const userActor = await getUserActor();
    const user = await userActor.getUserByEmail(validatedData.email);
    
    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Verify password
    const passwordValid = await verifyPassword(validatedData.password, user.passwordHash);
    if (!passwordValid) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Check if email is verified
    if (!user.isVerified) {
      return {
        success: false,
        error: 'Please verify your email before logging in',
      };
    }

    // Update last login
    await userActor.updateLastLogin(user.id);

    // Create session
    const sessionToken = await createSession({
      userId: user.id,
      email: user.email,
      isVerified: user.isVerified,
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('sid', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Reset rate limit on successful login
    resetLoginRateLimit(ip);

    return {
      success: true,
      message: 'Login successful',
    };
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

// OTP verification action
export async function verifyOTPAction(formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      otp: formData.get('otp') as string,
    };

    // Validate input
    const validatedData = otpVerificationSchema.parse(rawData);

    // Check rate limiting
    const rateLimit = checkOTPVerificationRateLimit(validatedData.email);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Too many verification attempts. Try again in ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} minutes.`,
      };
    }

    // Verify OTP
    const userActor = await getUserActor();
    const result = await userActor.verifyOTP(validatedData.email, validatedData.otp);
    
    if ('err' in result) {
      return {
        success: false,
        error: result.err,
      };
    }

    if (!result.ok) {
      return {
        success: false,
        error: 'Invalid OTP code',
      };
    }

    // Get user and verify email
    const user = await userActor.getUserByEmail(validatedData.email);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Mark email as verified
    const verifyResult = await userActor.verifyEmail(user.id);
    if ('err' in verifyResult) {
      return {
        success: false,
        error: 'Failed to verify email',
      };
    }

    // Send welcome email
    await emailService.sendWelcomeEmail(
      user.email,
      `${user.profile?.firstName || 'User'} ${user.profile?.lastName || ''}`
    );

    // Reset rate limits
    resetOTPRateLimit(validatedData.email);
    resetOTPVerificationRateLimit(validatedData.email);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Resend OTP action
export async function resendOTPAction(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    
    if (!isValidEmail(email)) {
      return {
        success: false,
        error: 'Invalid email address',
      };
    }

    // Check rate limiting
    const rateLimit = checkOTPRateLimit(email);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Too many OTP requests. Try again in ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} minutes.`,
      };
    }

    // Check if user exists
    const userActor = await getUserActor();
    const user = await userActor.getUserByEmail(email);
    
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    if (user.isVerified) {
      return {
        success: false,
        error: 'Email is already verified',
      };
    }

    // Generate and send new OTP
    const otpResult = await userActor.createOTP(email);
    
    if ('err' in otpResult) {
      return {
        success: false,
        error: 'Failed to create OTP. Please try again.',
      };
    }

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(
      email,
      otpResult.ok,
      `${user.profile?.firstName || 'User'} ${user.profile?.lastName || ''}`
    );

    if (!emailSent) {
      return {
        success: false,
        error: 'Failed to send verification email. Please try again.',
      };
    }

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  } catch (error) {
    console.error('Resend OTP error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Forgot password action
export async function forgotPasswordAction(formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
    };

    // Validate input
    const validatedData = forgotPasswordSchema.parse(rawData);

    // Check rate limiting
    const rateLimit = checkPasswordResetRateLimit(validatedData.email);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Too many password reset requests. Try again in ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} minutes.`,
      };
    }

    // Check if user exists
    const userActor = await getUserActor();
    const user = await userActor.getUserByEmail(validatedData.email);
    
    if (!user) {
      // Don't reveal if user exists or not
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Create password reset token
    const resetToken = await createPasswordResetToken(user.id);

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      `${user.profile?.firstName || 'User'} ${user.profile?.lastName || ''}`
    );

    if (!emailSent) {
      return {
        success: false,
        error: 'Failed to send password reset email. Please try again.',
      };
    }

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Reset password action
export async function resetPasswordAction(formData: FormData) {
  try {
    const rawData = {
      token: formData.get('token') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    // Validate input
    const validatedData = resetPasswordSchema.parse(rawData);

    // Verify reset token
    const userId = await verifyPasswordResetToken(validatedData.token);
    if (!userId) {
      return {
        success: false,
        error: 'Invalid or expired reset token',
      };
    }

    // Get user
    const userActor = await getUserActor();
    const user = await userActor.getUserById(userId);
    
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(validatedData.password);

    // Update password
    const result = await userActor.updatePassword(userId, newPasswordHash);
    
    if ('err' in result) {
      return {
        success: false,
        error: result.err,
      };
    }

    return {
      success: true,
      message: 'Password reset successfully',
    };
  } catch (error) {
    console.error('Reset password error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Logout action
export async function logoutAction() {
  try {
    await clearSession();
    redirect('/login');
  } catch (error) {
    console.error('Logout error:', error);
    redirect('/login');
  }
}

// Get current session
export async function getCurrentSession() {
  try {
    return await getSession();
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}
