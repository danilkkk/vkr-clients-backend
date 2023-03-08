import nodemailer from 'nodemailer';
import logger from "../logger.js";
import dotenv from 'dotenv';
dotenv.config();

class MailService {

    constructor() {
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
        const msg = {
            from: `${process.env.SMTP_USER}`,
            to: email,
            subject: `Активируйте свой аккаунт ${process.env.API_URL}`,
            text: '',
            html: `
            <div>
            <h1>${name},</h1>
            
            <h4>Для активации аккаунта перейдите по <a href="${link}">cссылке</a></h4>
            
            <a href="${link}">${link}</a>
            
            <div style="text-align: right"><i>C уважением,<i></div>
            <div style="text-align: right"><i>команда предприятия<i></div>
            <div>
            `
        };

        this.transporter.sendMail(msg , err => {
            if (err) {
                return logger.error(err);
            } else{
                logger.info('Sent email');
            }
        })
    }
}

export default new MailService()