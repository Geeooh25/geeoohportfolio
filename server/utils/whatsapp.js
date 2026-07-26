
exports.sendWhatsAppNotification = async ({ name, email, content, timestamp }) => {
  try {
    // Skip if Twilio not configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('📱 WhatsApp not configured - skipping notification');
      return;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);

    const message = await client.messages.create({
      body: `
🔔 *New Portfolio Message*

From: ${name}
Email: ${email}
Time: ${new Date(timestamp).toLocaleString()}

Message:
${content.substring(0, 200)}${content.length > 200 ? '...' : ''}
      `.trim(),
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${process.env.YOUR_WHATSAPP_NUMBER}`
    });

    console.log('✅ WhatsApp notification sent:', message.sid);
  } catch (error) {
    console.error('❌ WhatsApp notification failed:', error.message);
  }
};