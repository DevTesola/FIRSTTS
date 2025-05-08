// pages/api/cron/check-suspicious-activity.js
import { detectSuspiciousActivity } from '../../../utils/adminLogger';

// Mock email transport for Vercel compatibility (remove nodemailer dependency)
const mockTransporter = {
  async sendMail(options) {
    console.log(`[MOCK EMAIL] Would send email to ${options.to} with subject: ${options.subject}`);
    return { messageId: `mock-${Date.now()}`, response: 'Mock email sent' };
  }
};

// Use mock transport
const transporter = mockTransporter;

// Configure Telegram bot (if enabled)
const TELEGRAM_ENABLED = process.env.TELEGRAM_ENABLED === 'true';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Send alert via email
 * 
 * @param {Object} data - Alert data
 * @returns {Promise} - Result of sending email
 */
async function sendEmailAlert(data) {
  const adminList = data.admins.map(admin => 
    `- ${admin.admin_wallet.slice(0, 6)}...${admin.admin_wallet.slice(-4)}: ${admin.count} actions`
  ).join('\n');
  
  const mailOptions = {
    from: process.env.ALERT_FROM_EMAIL || process.env.SMTP_USER,
    to: process.env.ALERT_TO_EMAIL,
    subject: '🚨 SOLARA - Suspicious Admin Activity Detected',
    text: `Suspicious admin activity has been detected on the SOLARA platform!

Time window: Last ${data.timeWindow.minutes} minutes
Threshold: ${data.threshold} actions

Suspicious admins:
${adminList}

Please check the admin audit logs at: ${process.env.NEXT_PUBLIC_APP_URL}/admin/audit-logs

This is an automated alert.`,
    html: `
      <h2>🚨 Suspicious Admin Activity Detected</h2>
      <p>Suspicious admin activity has been detected on the SOLARA platform!</p>
      
      <ul>
        <li><strong>Time window:</strong> Last ${data.timeWindow.minutes} minutes</li>
        <li><strong>Threshold:</strong> ${data.threshold} actions</li>
      </ul>
      
      <h3>Suspicious admins:</h3>
      <ul>
        ${data.admins.map(admin => 
          `<li><strong>${admin.admin_wallet.slice(0, 6)}...${admin.admin_wallet.slice(-4)}:</strong> ${admin.count} actions</li>`
        ).join('')}
      </ul>
      
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/audit-logs">Check the admin audit logs</a></p>
      
      <p><em>This is an automated alert.</em></p>
    `,
  };
  
  return transporter.sendMail(mailOptions);
}

/**
 * Send alert via Telegram
 * 
 * @param {Object} data - Alert data
 * @returns {Promise} - Result of sending Telegram message
 */
async function sendTelegramAlert(data) {
  if (!TELEGRAM_ENABLED || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram alerts not configured, skipping');
    return;
  }
  
  const adminList = data.admins.map(admin => 
    `- ${admin.admin_wallet.slice(0, 6)}...${admin.admin_wallet.slice(-4)}: ${admin.count} actions`
  ).join('\n');
  
  const message = `
🚨 *SOLARA - Suspicious Admin Activity*

Suspicious admin activity detected:

Time window: Last ${data.timeWindow.minutes} minutes
Threshold: ${data.threshold} actions

*Suspicious admins:*
${adminList}

Check audit logs: ${process.env.NEXT_PUBLIC_APP_URL}/admin/audit-logs
  `;
  
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Send alerts through all configured channels
 * 
 * @param {Object} data - Alert data
 * @returns {Promise} - Result of sending alerts
 */
async function sendAlerts(data) {
  const promises = [];
  
  // Send email alert if configured
  if (process.env.ALERT_TO_EMAIL) {
    promises.push(sendEmailAlert(data).catch(error => {
      console.error('Error sending email alert:', error);
      return null;
    }));
  }
  
  // Send Telegram alert if configured
  if (TELEGRAM_ENABLED) {
    promises.push(sendTelegramAlert(data).catch(error => {
      console.error('Error sending Telegram alert:', error);
      return null;
    }));
  }
  
  return Promise.all(promises);
}

/**
 * API Handler for checking suspicious activity
 * Can be triggered by cron job or manual request
 */
export default async function handler(req, res) {
  // Verify this is a legitimate cron job request or admin request
  const cronSecret = req.headers['x-cron-secret'];
  const walletAddress = req.headers['x-wallet-address'];
  
  // Check authorization from either cron job secret or admin wallet
  const isCronJob = cronSecret === process.env.CRON_SECRET;
  const isAdminRequest = req.method === 'POST' && walletAddress && 
    (process.env.ADMIN_WALLET_ADDRESSES || '').split(',').includes(walletAddress);
  
  if (!isCronJob && !isAdminRequest) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get parameters from request or use defaults
    const timeWindowMinutes = req.body?.timeWindowMinutes || 60;
    const actionThreshold = req.body?.actionThreshold || 30;
    
    // Run the suspicious activity detection
    const result = await detectSuspiciousActivity({
      timeWindowMinutes,
      actionThreshold
    });
    
    // If suspicious activity detected, send alerts
    if (result.suspicious) {
      await sendAlerts(result);
      
      // Log the alert in admin_audit_logs
      if (isAdminRequest) {
        const { logAdminAction } = require('../../../utils/adminLogger');
        await logAdminAction({
          adminWallet: walletAddress,
          action: 'security_alert',
          targetId: null,
          metadata: {
            alert_type: 'suspicious_activity',
            suspicious_admins: result.admins.map(a => a.admin_wallet),
            time_window_minutes: timeWindowMinutes,
            action_threshold: actionThreshold
          },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      suspicious: result.suspicious,
      adminsChecked: result.admins?.length || 0,
      alertsSent: result.suspicious ? true : false,
      timeChecked: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking suspicious activity:', error);
    return res.status(500).json({ error: 'Failed to check suspicious activity' });
  }
}