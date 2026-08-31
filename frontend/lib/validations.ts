import { z } from 'zod';

// Auth schemas
export const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const otpVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile schemas
export const profileBasicSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  bio: z.string().max(500, 'Bio is too long').optional(),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  location: z.string().max(100, 'Location is too long').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  profileImageUrl: z.string().url('Invalid profile image URL').optional().or(z.literal('')),
});

export const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, 'Company name is required').max(100, 'Company name is too long'),
  position: z.string().min(1, 'Position is required').max(100, 'Position is too long'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  current: z.boolean().default(false),
});

export const educationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, 'Institution name is required').max(100, 'Institution name is too long'),
  degree: z.string().min(1, 'Degree is required').max(100, 'Degree is too long'),
  field: z.string().min(1, 'Field of study is required').max(100, 'Field of study is too long'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  gpa: z.string().max(10, 'GPA format is invalid').optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
});

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  bio: z.string().max(500, 'Bio is too long').optional(),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  location: z.string().max(100, 'Location is too long').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  skills: z.array(z.string().max(50, 'Skill name is too long')).max(20, 'Maximum 20 skills allowed'),
  experience: z.array(experienceSchema).max(20, 'Maximum 20 experiences allowed'),
  education: z.array(educationSchema).max(20, 'Maximum 20 education entries allowed'),
  profileImageUrl: z.string().url('Invalid profile image URL').optional().or(z.literal('')),
});

// File upload schemas
export const profileImageSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
}).refine((data) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(data.file.type);
}, {
  message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
}).refine((data) => {
  return data.file.size <= 5 * 1024 * 1024; // 5MB
}, {
  message: 'File size too large. Maximum size is 5MB.',
});

export const resumeSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
}).refine((data) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  return allowedTypes.includes(data.file.type);
}, {
  message: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.',
}).refine((data) => {
  return data.file.size <= 10 * 1024 * 1024; // 10MB
}, {
  message: 'File size too large. Maximum size is 10MB.',
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type exports
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OTPVerificationInput = z.infer<typeof otpVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileBasicInput = z.infer<typeof profileBasicSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfileImageInput = z.infer<typeof profileImageSchema>;
export type ResumeInput = z.infer<typeof resumeSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
