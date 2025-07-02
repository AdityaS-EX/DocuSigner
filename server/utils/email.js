
const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
    // Set the SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // If no API key is set, fallback to mock for local development
    if (!process.env.SENDGRID_API_KEY) {
        console.log('--- MOCK EMAIL (No SENDGRID_API_KEY configured in .env) ---');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('------------------');
        return; // Mock success
    }

    const msg = {
        to: options.email,
        from: process.env.EMAIL_FROM || 'noreply@yourverifieddomain.com', // This MUST be a verified sender in SendGrid
        subject: options.subject,
        text: options.message,
        // You can also add an html property for rich text emails
        // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };

    try {
        await sgMail.send(msg);
        console.log('Email sent successfully via SendGrid');
    } catch (error) {
        console.error('Error sending email via SendGrid:', error);

        // Log additional details from the error object if available
        if (error.response) {
            console.error(error.response.body);
        }
        
        throw new Error('Email could not be sent. Please try again later.');
    }
};

module.exports = sendEmail;
