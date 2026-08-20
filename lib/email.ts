import nodemailer from "nodemailer";
import { timelineLabel } from "./timeline";

export interface LetterForEmail {
  id: string;
  type: string;
  timelineKey: string;
  title: string;
  sections: string; // JSON string of [{prompt, text}]
  createdAt: Date;
}

function getTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER / EMAIL_PASS are not set. See README for Gmail app-password setup."
    );
  }

  // Defaults target Gmail SMTP; override EMAIL_HOST/PORT for another provider.
  return nodemailer.createTransport({
    host: host || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendLetterEmail(to: string, letter: LetterForEmail) {
  const transporter = getTransporter();
  const sections: { prompt: string; text: string }[] = JSON.parse(letter.sections);
  const writtenOn = letter.createdAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject =
    letter.type === "COMMIT"
      ? `A letter you wrote to yourself, ${timelineLabel(letter.timelineKey)} ago`
      : `The letter your future self imagined, ${timelineLabel(letter.timelineKey)} ago`;

  const bodyText = sections
    .map((s) => `${s.prompt}\n\n${s.text}\n`)
    .join("\n---\n\n");

  const text = `${letter.title}\nWritten on ${writtenOn}\n\n${bodyText}`;

  const htmlSections = sections
    .map(
      (s) => `
        <p style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#8a5f2e;margin:28px 0 8px;">${escapeHtml(
          s.prompt
        )}</p>
        <p style="font-family:Georgia,serif;font-size:17px;line-height:1.7;color:#2b2a28;white-space:pre-wrap;margin:0;">${escapeHtml(
          s.text
        )}</p>`
    )
    .join("");

  const html = `
    <div style="background:#F5F3EC;padding:40px 20px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #DCD7C8;border-radius:6px;padding:40px;">
        <p style="font-family:Georgia,serif;font-size:13px;color:#5A574F;margin:0 0 4px;">Written on ${writtenOn}</p>
        <h1 style="font-family:Georgia,serif;font-size:26px;color:#1C1A38;margin:0 0 24px;">${escapeHtml(
          letter.title
        )}</h1>
        ${htmlSections}
        <p style="margin-top:36px;font-family:Georgia,serif;font-size:13px;color:#8a8578;">— sent by Future Self, exactly when you asked to hear it.</p>
      </div>
    </div>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}
