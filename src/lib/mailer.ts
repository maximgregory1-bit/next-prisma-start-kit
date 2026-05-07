import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

async function getMailer() {
    const oauth2Client = new OAuth2Client(process.env.GOOGLE_MAIL_CLIENT_ID, process.env.GOOGLE_MAIL_CLIENT_SECRET, "https://developers.google.com/oauthplayground");

    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_MAIL_REFRESH_TOKEN,
    });

    const accessToken = await new Promise<string>((resolve, reject) => {
        oauth2Client.getAccessToken((err: Error | null, token?: string | null) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(token ?? "");
        });
    });

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.GOOGLE_MAIL_ADDRESS,
            accessToken,
            clientId: process.env.GOOGLE_MAIL_CLIENT_ID,
            clientSecret: process.env.GOOGLE_MAIL_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_MAIL_REFRESH_TOKEN,
        },
    });
}

export async function sendResetEmail({ to, resetLink }: { to: string; resetLink: string }) {
    const transporter = await getMailer();
    const from = process.env.GOOGLE_MAIL_ADDRESS ?? "no-reply@example.com";

    await transporter.sendMail({
        from,
        to,
        subject: "Reset your password",
        text: `Reset your password using this link: ${resetLink}`,
        html: `<p>Reset your password using this link:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });
}

export async function sendMail({ from, to, subject, text, html }: { from?: string; to?: string; subject: string; text: string; html?: string }) {
    const transporter = await getMailer();
    const fromAddress = from ?? process.env.GOOGLE_MAIL_ADDRESS ?? "no-reply@example.com";

    return transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html: html ?? "",
    });
}
