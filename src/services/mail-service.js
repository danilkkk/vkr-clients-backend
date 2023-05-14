import nodemailer from 'nodemailer';
import logger from "../logger.js";
import dotenv from 'dotenv';
dotenv.config();

class MailService {

    constructor() {
        logger.info('[MailService] initialization...');

        this.transporter = nodemailer.createTransport({
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
            port: process.env.SMTP_PORT,
            host: process.env.SMTP_HOST
        }, {
                from: `Mail Service <${process.env.SMTP_USER}>`
        })
    }

    async sendActivationLink(email, name, link) {
        const html = `
            <div>
            <h1>${name},</h1>
            
            <h4>Для активации аккаунта перейдите по <a href="${link}">cссылке</a></h4>
            
            <a href="${link}">${link}</a>
            
            <div style="text-align: right"><i>C уважением,<i></div>
            <div style="text-align: right"><i>команда предприятия<i></div>
            <div>
            `;

        const subject = `Активируйте свой аккаунт ${process.env.API_URL}`;

        await this.sendMail(email, subject, html)
    }

    async sendResetPasswordLink(email, name, link) {
        const html = `
            <div>
            <h1>${name},</h1>
            
            <h4>Для смены пароля перейдите по ссылке <a href="${link}">cссылке</a></h4>
            
            <p>Если Вы не запрашивали смену пароля, игнорируйте это письмо</p>
            
            <a href="${link}">${link}</a>
            
            <div style="text-align: right"><i>C уважением,<i></div>
            <div style="text-align: right"><i>команда предприятия<i></div>
            <div>
            `;

        const subject = `Смена пароля ${process.env.API_URL}`;

        await this.sendMail(email, subject, html)
    }

    async sendMail(to, subject, html) {
        const msg = {
            from: `${process.env.SMTP_USER}`,
            to,
            subject,
            text: '',
            html
        };

        try {
            await this.transporter.sendMail(msg);
            logger.info('Sent email');
        } catch (e) {
            logger.error(e);
        }
    }
}

export default new MailService()