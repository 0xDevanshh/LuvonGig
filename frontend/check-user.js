// Check if t3chnobromo@gmail.com exists in the user canister
import { getUserActor } from './lib/ic-agent.js';

async function checkSpecificUser() {
  console.log('🔍 Checking for user: t3chnobromo@gmail.com\n');

  try {
    const actor = await getUserActor();
    console.log('✅ Connected to user canister successfully');

    const targetEmail = 't3chnobromo@gmail.com';
    console.log(`📧 Searching for user with email: ${targetEmail}\n`);

    // Get user by email
    try {
      const user = await actor.getUserByEmail(targetEmail);

      if (user && user.length > 0) {
        const userData = user[0];
        console.log('✅ USER FOUND!\n');
        console.log('='.repeat(60));
        console.log('👤 USER DETAILS');
        console.log('='.repeat(60));

        // Basic user information
        console.log('📋 Basic Information:');
        console.log(`   ID: ${userData.id}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Verified: ${userData.isVerified ? '✅ Yes' : '❌ No'}`);
        console.log(`   Profile Submitted: ${userData.profileSubmitted ? '✅ Yes' : '❌ No'}`);

        // Timestamps
        console.log('\n⏰ Timestamps:');
        console.log(`   Created At: ${new Date(Number(userData.createdAt)).toLocaleString()}`);
        if (userData.lastLoginAt && userData.lastLoginAt[0]) {
          console.log(`   Last Login: ${new Date(Number(userData.lastLoginAt[0])).toLocaleString()}`);
        } else {
          console.log('   Last Login: Never');
        }

        // Password hash (partial for security)
        console.log('\n🔐 Security:');
        console.log(`   Password Hash: ${userData.passwordHash.substring(0, 20)}...`);

        // Profile data
        console.log('\n📊 Profile Data:');
        if (userData.profile && userData.profile[0]) {
          const profile = userData.profile[0];
          console.log(`   Name: ${profile.firstName} ${profile.lastName}`);
          console.log(`   Bio: ${profile.bio && profile.bio[0] || 'Not provided'}`);
          console.log(`   Phone: ${profile.phone && profile.phone[0] || 'Not provided'}`);
          console.log(`   Location: ${profile.location && profile.location[0] || 'Not provided'}`);
          console.log(`   Website: ${profile.website && profile.website[0] || 'Not provided'}`);
          console.log(`   LinkedIn: ${profile.linkedin && profile.linkedin[0] || 'Not provided'}`);
          console.log(`   GitHub: ${profile.github && profile.github[0] || 'Not provided'}`);
          console.log(`   Twitter: ${profile.twitter && profile.twitter[0] || 'Not provided'}`);
          console.log(`   Profile Image: ${profile.profileImageUrl && profile.profileImageUrl[0] || 'Not provided'}`);
          console.log(`   Resume URL: ${profile.resumeUrl && profile.resumeUrl[0] || 'Not provided'}`);

          console.log('\n🛠️ Skills:');
          if (profile.skills && profile.skills.length > 0) {
            console.log(`   Skills (${profile.skills.length}): ${profile.skills.join(', ')}`);
          } else {
            console.log('   Skills: None listed');
          }

          console.log('\n💼 Experience:');
          if (profile.experience && profile.experience.length > 0) {
            console.log(`   Experience Entries: ${profile.experience.length}`);
            profile.experience.forEach((exp, index) => {
              console.log(`   ${index + 1}. ${exp.position} at ${exp.company}`);
              console.log(`      From: ${exp.startDate} ${exp.endDate && exp.endDate[0] ? `To: ${exp.endDate[0]}` : '(Current)'}`);
              if (exp.description && exp.description[0]) {
                console.log(`      Description: ${exp.description[0]}`);
              }
            });
          } else {
            console.log('   Experience: None listed');
          }

          console.log('\n🎓 Education:');
          if (profile.education && profile.education.length > 0) {
            console.log(`   Education Entries: ${profile.education.length}`);
            profile.education.forEach((edu, index) => {
              console.log(`   ${index + 1}. ${edu.degree} in ${edu.field}`);
              console.log(`      Institution: ${edu.institution}`);
              console.log(`      From: ${edu.startDate} ${edu.endDate && edu.endDate[0] ? `To: ${edu.endDate[0]}` : '(Current)'}`);
              if (edu.gpa && edu.gpa[0]) {
                console.log(`      GPA: ${edu.gpa[0]}`);
              }
              if (edu.description && edu.description[0]) {
                console.log(`      Description: ${edu.description[0]}`);
              }
            });
          } else {
            console.log('   Education: None listed');
          }

        } else {
          console.log('   Profile: No profile data found');
        }

        // OTP Data
        console.log('\n🔢 OTP Data:');
        if (userData.otpData && userData.otpData[0]) {
          const otpData = userData.otpData[0];
          console.log(`   Code Exists: ${otpData.code ? 'Yes' : 'No'}`);
          console.log(`   Expires At: ${new Date(Number(otpData.expiresAt)).toLocaleString()}`);
          console.log(`   Attempts: ${otpData.attempts}`);
        } else {
          console.log('   OTP Data: None found');
        }

        console.log('\n='.repeat(60));
        console.log('🎯 SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ User exists: ${userData.email}`);
        console.log(`📧 Email verified: ${userData.isVerified ? 'Yes' : 'No'}`);
        console.log(`📋 Profile completed: ${userData.profile && userData.profile[0] ? 'Yes' : 'No'}`);
        console.log(`📤 Profile submitted: ${userData.profileSubmitted ? 'Yes' : 'No'}`);

        // Additional checks
        const profile = userData.profile && userData.profile[0];
        if (profile) {
          const hasBasicInfo = profile.firstName && profile.lastName;
          const hasSkills = profile.skills && profile.skills.length > 0;
          const hasResume = profile.resumeUrl && profile.resumeUrl[0];
          const hasExperience = profile.experience && profile.experience.length > 0;
          const hasEducation = profile.education && profile.education.length > 0;

          console.log(`\n📊 Profile Completeness:`);
          console.log(`   ✅ Basic Info: ${hasBasicInfo ? 'Complete' : 'Missing'}`);
          console.log(`   ✅ Skills: ${hasSkills ? 'Complete' : 'Missing'}`);
          console.log(`   ✅ Resume: ${hasResume ? 'Complete' : 'Missing'}`);
          console.log(`   ✅ Experience: ${hasExperience ? 'Complete' : 'Missing'}`);
          console.log(`   ✅ Education: ${hasEducation ? 'Complete' : 'Missing'}`);
        }

      } else {
        console.log('❌ USER NOT FOUND');
        console.log(`The email ${targetEmail} does not exist in the user canister.`);
      }

    } catch (error) {
      console.error('❌ Error retrieving user:', error.message);
      console.error('Full error:', error);
    }

  } catch (error) {
    console.error('❌ Failed to connect to canister:', error.message);
    console.error('Full error:', error);
  }
}

checkSpecificUser();