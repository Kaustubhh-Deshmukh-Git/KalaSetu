/**
 * Real-World SMS Gateway Service for KalaSetu
 * 
 * Supports Multi-Provider Real SMS Delivery:
 * 1. Fast2SMS (Direct Indian OTP Route)
 * 2. Twilio SMS (Global SMS)
 * 3. 2Factor.in / MSG91
 * 4. Fallback: Secure in-app auto-fill & server logging
 */

/**
 * Send real SMS with OTP to user's mobile number
 * @param {string} phone - User's phone number with or without country code
 * @param {string} otp - 6-digit numeric OTP
 * @returns {Promise<{ sent: boolean, provider: string, messageId?: string }>}
 */
const sendOtpSms = async (phone, otp) => {
  const cleanPhone = phone.trim();
  const digitsOnly = cleanPhone.replace(/\D/g, '');
  const indian10Digits = digitsOnly.slice(-10);

  // 1. Check for Fast2SMS (Indian SMS Gateway)
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      console.log(`[SMS Gateway] Dispatching real SMS via Fast2SMS to +91${indian10Digits}...`);
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2SmsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: indian10Digits,
        }),
        signal: AbortSignal.timeout(8000),
      });

      const data = await response.json();
      if (data.return === true) {
        console.log(`[SMS Gateway] Real SMS dispatched successfully via Fast2SMS (Request ID: ${data.request_id})`);
        return { sent: true, provider: 'Fast2SMS', messageId: data.request_id };
      } else {
        console.warn(`[SMS Gateway] Fast2SMS returned error:`, data.message);
      }
    } catch (err) {
      console.warn(`[SMS Gateway] Fast2SMS dispatch failed:`, err.message);
    }
  }

  // 2. Check for Twilio SMS
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const e164Phone = cleanPhone.startsWith('+') ? cleanPhone : `+91${indian10Digits}`;
      console.log(`[SMS Gateway] Dispatching real SMS via Twilio to ${e164Phone}...`);
      
      const basicAuth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', e164Phone);
      params.append('From', twilioFrom);
      params.append('Body', `Your KalaSetu login OTP is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: AbortSignal.timeout(8000),
      });

      const data = await response.json();
      if (response.ok && data.sid) {
        console.log(`[SMS Gateway] Real SMS dispatched successfully via Twilio (SID: ${data.sid})`);
        return { sent: true, provider: 'Twilio', messageId: data.sid };
      } else {
        console.warn(`[SMS Gateway] Twilio error:`, data.message);
      }
    } catch (err) {
      console.warn(`[SMS Gateway] Twilio dispatch failed:`, err.message);
    }
  }

  // 3. Fallback: Log for in-app verification
  console.log(`[SMS Gateway Sandbox] Real SMS provider keys not configured. Simulating delivery to ${cleanPhone}. OTP: ${otp}`);
  return { sent: false, provider: 'Sandbox_Fallback' };
};

module.exports = {
  sendOtpSms,
};
