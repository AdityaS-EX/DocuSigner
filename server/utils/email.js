
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // For development, if no real SMTP server is configured, we can use a mock.
    // If EMAIL_HOST is not configured in the .env file, use a mock for development.
    if (!process.env.EMAIL_HOST) {
        console.log('--- MOCK EMAIL (No EMAIL_HOST configured in .env) ---');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('------------------');
        return Promise.resolve(); // Mock success
    }

    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
        // Note: For services like Gmail, you might need to configure "less secure apps"
        // or use OAuth2. For production, a transactional email service is better.
    });

    // 2) Define the email options
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'DocuSigner <noreply@docusigner.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.html // You can also pass HTML content
    };

    // 3) Actually send the email
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Failed to send email:", error);
        // Depending on the app's needs, you might want to throw the error
        // to be handled by the calling function.
        throw new Error('Email could not be sent.');
    }
};

module.exports = sendEmail;
