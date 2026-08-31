# Next.js User Management App with Internet Computer

A comprehensive user management application built with Next.js App Router, featuring authentication, profile management, and file uploads, powered by Internet Computer (IC) canisters and AWS S3.

## 🚀 Features

### Authentication & Security
- **JWT-based sessions** with HTTP-only cookies
- **OTP email verification** using Nodemailer SMTP
- **Password reset** functionality with secure tokens
- **Rate limiting** for OTP and authentication attempts
- **Argon2 password hashing** for enhanced security
- **Input validation** using Zod schemas

### User Management
- **Complete CRUD operations** for user profiles
- **Experience and education tracking**
- **Skills management** with dynamic tags
- **Social links** (LinkedIn, GitHub, Twitter, Website)
- **Profile image and resume uploads** via AWS S3

### Technical Stack
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for modern UI
- **Internet Computer** for data persistence
- **Motoko** canisters for backend logic
- **AWS S3** for file storage
- **Nodemailer** for email services

## 📁 Project Structure

```
finalicp/
├── backend/
│   ├── canisters/
│   │   └── user.mo              # Motoko user canister
│   ├── dfx.json                # IC configuration
│   └── package.json
├── frontend/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Protected pages
│   │   └── profile/           # Profile management
│   ├── components/
│   │   └── auth/              # Authentication components
│   ├── lib/
│   │   ├── actions/           # Server Actions
│   │   ├── auth.ts            # Authentication utilities
│   │   ├── email.ts          # Email service
│   │   ├── ic-agent.ts       # IC agent wrapper
│   │   ├── rate-limit.ts     # Rate limiting
│   │   ├── s3.ts             # AWS S3 service
│   │   └── validations.ts    # Zod schemas
│   └── middleware.ts          # Route protection
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- Internet Computer SDK (dfx)
- AWS Account with S3 access
- SMTP email service (Gmail, SendGrid, etc.)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd finalicp

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the `frontend` directory:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# IC Configuration
IC_HOST=http://localhost:4943
USER_CANISTER_ID=your-user-canister-id-here

# SMTP Configuration (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# App Configuration
APP_NAME=Your App Name
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Internet Computer Setup

```bash
# Start local IC replica
cd backend
dfx start --clean

# Deploy canisters
dfx deploy

# Get canister IDs
dfx canister id user
```

Update the `USER_CANISTER_ID` in your `.env.local` file with the deployed canister ID.

### 4. AWS S3 Setup

1. Create an S3 bucket
2. Configure CORS policy:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": []
  }
]
```
3. Set up IAM user with S3 permissions

### 5. Email Service Setup

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `SMTP_PASS`

For other providers, update the SMTP configuration accordingly.

### 6. Run the Application

```bash
# Start the frontend
cd frontend
npm run dev

# The app will be available at http://localhost:3000
```

## 🔧 Development

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm run format       # Format code

# Backend (IC)
dfx start            # Start local IC replica
dfx deploy           # Deploy canisters
dfx stop             # Stop IC replica
```

### Key Components

#### Authentication Flow
1. **Signup** → Email verification → **Login**
2. **Forgot Password** → Reset link → **New Password**
3. **JWT Sessions** with 7-day expiration

#### Profile Management
- **Basic Info**: Name, bio, contact details
- **Social Links**: Website, LinkedIn, GitHub, Twitter
- **Skills**: Dynamic tag management
- **Files**: Profile image and resume uploads

#### Security Features
- **Rate Limiting**: OTP (5/day), Login (5/15min), Password Reset (3/hour)
- **Input Validation**: Zod schemas for all forms
- **Password Security**: Argon2 hashing with strong requirements
- **Session Management**: HTTP-only cookies with JWT

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Use secure secret management
2. **Rate Limiting**: Consider Redis for distributed rate limiting
3. **Database**: The current setup uses in-memory storage for rate limiting
4. **Monitoring**: Add logging and error tracking
5. **Security**: Enable HTTPS, secure cookies, and CORS

### IC Mainnet Deployment

```bash
# Deploy to mainnet
dfx deploy --network ic

# Update IC_HOST to https://ic0.app
# Update USER_CANISTER_ID with mainnet canister ID
```

## 📚 API Reference

### Server Actions

#### Authentication
- `signupAction(formData)` - Create new user account
- `loginAction(formData)` - User login
- `verifyOTPAction(formData)` - Verify email with OTP
- `resendOTPAction(formData)` - Resend OTP code
- `forgotPasswordAction(formData)` - Request password reset
- `resetPasswordAction(formData)` - Reset password with token
- `logoutAction()` - Clear session and logout

#### Profile Management
- `getProfileAction()` - Get user profile
- `updateProfileAction(formData)` - Update profile data
- `uploadProfileImageAction(formData)` - Upload profile image
- `uploadResumeAction(formData)` - Upload resume
- `deleteProfileImageAction()` - Delete profile image
- `deleteResumeAction()` - Delete resume
- `changePasswordAction(formData)` - Change password

### Motoko Canister Interface

```motoko
// User Management
createUser(email: Text, passwordHash: Text) -> Result<UserId, Text>
getUserById(userId: Text) -> ?User
getUserByEmail(email: Text) -> ?User
updatePassword(userId: Text, newPasswordHash: Text) -> Result<(), Text>
verifyEmail(userId: Text) -> Result<(), Text>

// Profile Management
updateProfile(userId: Text, profile: ProfileData) -> Result<(), Text>
getProfile(userId: Text) -> ?ProfileData

// OTP Management
createOTP(email: Text) -> Result<Text, Text>
verifyOTP(email: Text, code: Text) -> Result<Bool, Text>
deleteOTP(email: Text) -> ()
```

## 🔒 Security Features

### Authentication Security
- **JWT Tokens**: Signed with HMAC-SHA256
- **Password Hashing**: Argon2id with memory cost 2^16
- **Session Management**: HTTP-only cookies, 7-day expiration
- **Rate Limiting**: Per-IP and per-email limits

### Input Validation
- **Zod Schemas**: Type-safe validation for all inputs
- **Email Validation**: RFC-compliant email format checking
- **Password Requirements**: 8+ chars, uppercase, lowercase, number, special char
- **File Upload**: Type and size validation for images and documents

### Data Protection
- **Sensitive Data**: Passwords hashed, no plain text storage
- **File Security**: S3 with proper ACL and metadata
- **Session Security**: Secure, HttpOnly cookies
- **CORS**: Configured for production domains

## 🐛 Troubleshooting

### Common Issues

1. **IC Connection Issues**
   - Ensure dfx is running: `dfx start`
   - Check canister ID in environment variables
   - Verify IC_HOST configuration

2. **Email Not Sending**
   - Check SMTP credentials
   - Verify email service settings
   - Check rate limiting

3. **File Upload Issues**
   - Verify AWS credentials
   - Check S3 bucket permissions
   - Ensure CORS is configured

4. **Authentication Issues**
   - Check JWT_SECRET is set
   - Verify session cookie settings
   - Check middleware configuration

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` and check console output for detailed error messages.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation

---

**Note**: This is a comprehensive user management system. Make sure to configure all environment variables and services properly before deploying to production.