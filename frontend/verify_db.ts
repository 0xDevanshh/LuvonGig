import { getDbPool } from './lib/db/chat-db';
import { getUserUsage, incrementMessageCount } from './lib/db/usage-service';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const result = await getDbPool().query('SELECT email FROM user_usage LIMIT 1');
  if (result.rows.length === 0) {
    console.log('No users found in user_usage');
    return;
  }

  const email = result.rows[0].email;
  console.log(`Testing with email: ${email}`);

  const initialUsage = await getUserUsage(email);
  console.log('Initial usage:', initialUsage?.daily_messages_count);

  const success = await incrementMessageCount(email);
  console.log('Increment success:', success);

  const finalUsage = await getUserUsage(email);
  console.log('Final usage:', finalUsage?.daily_messages_count);
  
  if (finalUsage && initialUsage && finalUsage.daily_messages_count === initialUsage.daily_messages_count + 1) {
    console.log('VERIFICATION SUCCESSFUL');
  } else {
    console.log('VERIFICATION FAILED');
  }
}

run().catch(console.error).finally(() => process.exit());
