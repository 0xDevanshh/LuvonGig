const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Log file path
const logFile = path.join(__dirname, '../socket-server.log');

// Create log file if it doesn't exist
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, '');
}

// Function to log messages with timestamp
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(logFile, logMessage);
}

log('Starting Socket.IO server...');

// Path to the compiled server file
const serverPath = path.join(__dirname, '../lib/socket-server.ts');

// Check if ts-node is available, otherwise use node with compiled JS
const useTsNode = fs.existsSync('/home/neoweave/.npm/_npx/1bf7c3c15bf47d04/node_modules/ts-node/dist/index.js');

let command, args;

if (useTsNode) {
  command = 'npx';
  args = ['ts-node', serverPath];
} else {
  // Try to compile to JS first
  command = 'node';
  args = [serverPath.replace('.ts', '.js')];
}

log(`Using command: ${command} ${args.join(' ')}`);

// Spawn the server process
const serverProcess = spawn(command, args, {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '4000'
  }
});

// Handle process events
serverProcess.on('error', (error) => {
  log(`Server process error: ${error.message}`);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  log(`Server process exited with code ${code}`);
  if (code !== 0) {
    log('Server exited with error code. Check logs for details.');
    process.exit(1);
  }
});

// Handle shutdown
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down Socket.IO server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down Socket.IO server...');
  serverProcess.kill('SIGTERM');
});

// Store process info for potential later use
process.socketServerProcess = serverProcess;

log('Socket.IO server startup initiated.');