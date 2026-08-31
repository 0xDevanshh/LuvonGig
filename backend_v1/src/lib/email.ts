/**
 * SMTP email, ported from frontend/lib/email.ts.
 *
 * Keeps the development fallback: when SMTP is unconfigured or unreachable,
 * the message (OTP code included) is logged instead of sent, so local signup
 * works without credentials. That fallback is disabled in production — silently
 * "sending" a password reset that never arrives is worse than a visible error.
 */
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let transporter: Transporter | null = null;
let transportChecked = false;

function build(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

async function getTransporter(): Promise<Transporter | null> {
  if (transportChecked) return transporter;
  transportChecked = true;

  transporter = build();
  if (!transporter) {
    if (env.isProduction) throw new Error('SMTP is not configured');
    logger.warn('SMTP not configured — emails will be logged, not sent');
    return null;
  }

  try {
    await transporter.verify();
    logger.info('SMTP connection verified');
  } catch (err) {
    if (env.isProduction) throw err;
    logger.warn({ err }, 'SMTP verification failed — falling back to logging');
    transporter = null;
  }
  return transporter;
}

interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function send(mail: Mail): Promise<void> {
  const tx = await getTransporter();

  if (!tx) {
    logger.info({ to: mail.to, subject: mail.subject, body: mail.text }, 'EMAIL (not sent — no SMTP)');
    return;
  }

  await tx.sendMail({ from: env.SMTP_FROM || env.SMTP_USER, ...mail });
  logger.info({ to: mail.to, subject: mail.subject }, 'Email sent');
}

function layout(heading: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f7f9;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1a1a1a">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
    <h1 style="margin:0 0 16px;font-size:20px">${heading}</h1>
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#6b7280">LuvonGig</p>
  </div></body></html>`;
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await send({
    to,
    subject: 'Your LuvonGig verification code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: layout(
      'Verify your email',
      `<p style="margin:0 0 20px;color:#4b5563">Enter this code to finish signing in.</p>
       <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0 0 20px">${code}</p>
       <p style="margin:0;font-size:13px;color:#6b7280">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>`,
    ),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await send({
    to,
    subject: 'Reset your LuvonGig password',
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request it, ignore this email.`,
    html: layout(
      'Reset your password',
      `<p style="margin:0 0 20px;color:#4b5563">Click below to choose a new password.</p>
       <p style="margin:0 0 20px"><a href="${resetUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px">Reset password</a></p>
       <p style="margin:0;font-size:13px;color:#6b7280">This link expires in 1 hour. If you didn't request it, you can ignore this email — your password will not change.</p>`,
    ),
  });
}
