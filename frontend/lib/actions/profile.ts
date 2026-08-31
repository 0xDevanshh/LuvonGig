'use server';

import { z } from 'zod';
import { 
  profileUpdateSchema, 
  changePasswordSchema, 
  profileImageSchema, 
  resumeSchema 
} from '../validations';
import { 
  getSession, 
  hashPassword, 
  verifyPassword 
} from '../auth';
import { getUserActor } from '../ic-agent';
import s3Service from '../s3';

// Get user profile
export async function getProfileAction() {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const userActor = await getUserActor();
    const profile = await userActor.getProfile(session.userId);

    return {
      success: true,
      profile,
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      error: 'Failed to get profile',
    };
  }
}

// Update user profile
export async function updateProfileAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const rawData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      bio: formData.get('bio') as string || null,
      phone: formData.get('phone') as string || null,
      location: formData.get('location') as string || null,
      website: formData.get('website') as string || null,
      linkedin: formData.get('linkedin') as string || null,
      github: formData.get('github') as string || null,
      twitter: formData.get('twitter') as string || null,
      skills: JSON.parse(formData.get('skills') as string || '[]'),
      experience: JSON.parse(formData.get('experience') as string || '[]'),
      education: JSON.parse(formData.get('education') as string || '[]'),
    };

    // Validate input
    const validatedData = profileUpdateSchema.parse(rawData);

    // Update profile in canister
    const userActor = await getUserActor();
    const result = await userActor.updateProfile(session.userId, validatedData);

    if ('err' in result) {
      return {
        success: false,
        error: result.err,
      };
    }

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: 'Failed to update profile',
    };
  }
}

// Upload profile image
export async function uploadProfileImageAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Validate file
    const validatedData = profileImageSchema.parse({ file });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const uploadResult = await s3Service.uploadProfileImage(
      buffer,
      file.name,
      session.userId
    );

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload image',
      };
    }

    // Update profile with new image URL
    const userActor = await getUserActor();
    const currentProfile = await userActor.getProfile(session.userId);
    
    if (currentProfile) {
      const updatedProfile = {
        ...currentProfile,
        profileImageUrl: uploadResult.url,
      };

      const result = await userActor.updateProfile(session.userId, updatedProfile);
      
      if ('err' in result) {
        return {
          success: false,
          error: 'Failed to update profile with new image',
        };
      }
    }

    return {
      success: true,
      message: 'Profile image uploaded successfully',
      url: uploadResult.url,
    };
  } catch (error) {
    console.error('Upload profile image error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: 'Failed to upload profile image',
    };
  }
}

// Upload resume
export async function uploadResumeAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Validate file
    const validatedData = resumeSchema.parse({ file });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const uploadResult = await s3Service.uploadResume(
      buffer,
      file.name,
      session.userId
    );

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload resume',
      };
    }

    // Update profile with new resume URL
    const userActor = await getUserActor();
    const currentProfile = await userActor.getProfile(session.userId);
    
    if (currentProfile) {
      const updatedProfile = {
        ...currentProfile,
        resumeUrl: uploadResult.url,
      };

      const result = await userActor.updateProfile(session.userId, updatedProfile);
      
      if ('err' in result) {
        return {
          success: false,
          error: 'Failed to update profile with new resume',
        };
      }
    }

    return {
      success: true,
      message: 'Resume uploaded successfully',
      url: uploadResult.url,
    };
  } catch (error) {
    console.error('Upload resume error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: 'Failed to upload resume',
    };
  }
}

// Delete profile image
export async function deleteProfileImageAction() {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Get current profile
    const userActor = await getUserActor();
    const currentProfile = await userActor.getProfile(session.userId);
    
    if (!currentProfile || !currentProfile.profileImageUrl) {
      return {
        success: false,
        error: 'No profile image to delete',
      };
    }

    // Extract S3 key from URL
    const s3Key = s3Service.extractKeyFromUrl(currentProfile.profileImageUrl);
    if (s3Key) {
      // Delete from S3
      await s3Service.deleteFile(s3Key);
    }

    // Update profile to remove image URL
    const updatedProfile = {
      ...currentProfile,
      profileImageUrl: null,
    };

    const result = await userActor.updateProfile(session.userId, updatedProfile);
    
    if ('err' in result) {
      return {
        success: false,
        error: 'Failed to update profile',
      };
    }

    return {
      success: true,
      message: 'Profile image deleted successfully',
    };
  } catch (error) {
    console.error('Delete profile image error:', error);
    return {
      success: false,
      error: 'Failed to delete profile image',
    };
  }
}

// Delete resume
export async function deleteResumeAction() {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Get current profile
    const userActor = await getUserActor();
    const currentProfile = await userActor.getProfile(session.userId);
    
    if (!currentProfile || !currentProfile.resumeUrl) {
      return {
        success: false,
        error: 'No resume to delete',
      };
    }

    // Extract S3 key from URL
    const s3Key = s3Service.extractKeyFromUrl(currentProfile.resumeUrl);
    if (s3Key) {
      // Delete from S3
      await s3Service.deleteFile(s3Key);
    }

    // Update profile to remove resume URL
    const updatedProfile = {
      ...currentProfile,
      resumeUrl: null,
    };

    const result = await userActor.updateProfile(session.userId, updatedProfile);
    
    if ('err' in result) {
      return {
        success: false,
        error: 'Failed to update profile',
      };
    }

    return {
      success: true,
      message: 'Resume deleted successfully',
    };
  } catch (error) {
    console.error('Delete resume error:', error);
    return {
      success: false,
      error: 'Failed to delete resume',
    };
  }
}

// Change password
export async function changePasswordAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const rawData = {
      currentPassword: formData.get('currentPassword') as string,
      newPassword: formData.get('newPassword') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    // Validate input
    const validatedData = changePasswordSchema.parse(rawData);

    // Get user to verify current password
    const userActor = await getUserActor();
    const user = await userActor.getUserById(session.userId);
    
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Verify current password
    const currentPasswordValid = await verifyPassword(validatedData.currentPassword, user.passwordHash);
    if (!currentPasswordValid) {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(validatedData.newPassword);

    // Update password
    const result = await userActor.updatePassword(session.userId, newPasswordHash);
    
    if ('err' in result) {
      return {
        success: false,
        error: result.err,
      };
    }

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: 'Failed to change password',
    };
  }
}

// Get user data
export async function getUserDataAction() {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const userActor = await getUserActor();
    const user = await userActor.getUserById(session.userId);
    
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Remove sensitive data
    const { passwordHash, otpData, ...userData } = user;

    return {
      success: true,
      user: userData,
    };
  } catch (error) {
    console.error('Get user data error:', error);
    return {
      success: false,
      error: 'Failed to get user data',
    };
  }
}
