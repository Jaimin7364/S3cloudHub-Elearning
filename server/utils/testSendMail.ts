require('dotenv').config();
import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions): Promise<void> => {
    try {
        console.log('SMTP_HOST:', process.env.SMTP_HOST);
        console.log('SMTP_PORT:', process.env.SMTP_PORT);
        console.log('SMTP_MAIL:', process.env.SMTP_MAIL);
        console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD);

        const transporter: Transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const { email, subject, template, data } = options;

        // get the path to the email file 
        const templatePath = path.join(__dirname, '../mails', template);

        // render the email template with ejs
        const html: string = await ejs.renderFile(templatePath, data);

        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: email,
            subject,
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error; 
    }
};

const testSendMail = async () => {
    const data = {
        user: { name: 'Test User' },
        activationCode: '123456',
    };

    try {
        await sendMail({
            email: 'ravaly950@gmail.com', // Replace with a valid recipient email
            subject: 'Test Email',
            template: 'activation-mail.ejs',
            data,
        });
    } catch (error) {
        console.error('Failed to send email:', error);
    }
};

testSendMail();
