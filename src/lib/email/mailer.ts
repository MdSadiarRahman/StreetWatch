import net from "net";
import tls from "tls";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSendResult {
  delivered: boolean;
  transport: "smtp" | "dev-dry-run";
}

interface CapturedEmailPreview {
  to: string;
  subject: string;
  html: string;
  text: string;
  sentAt: string;
}

const globalForMailPreview = globalThis as unknown as {
  __streetwatchDevOutbox?: CapturedEmailPreview[];
};

function recordDevPreview(msg: EmailMessage) {
  if (!globalForMailPreview.__streetwatchDevOutbox) {
    globalForMailPreview.__streetwatchDevOutbox = [];
  }
  globalForMailPreview.__streetwatchDevOutbox.unshift({
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
    sentAt: new Date().toISOString(),
  });
  if (globalForMailPreview.__streetwatchDevOutbox.length > 25) {
    globalForMailPreview.__streetwatchDevOutbox.length = 25;
  }
}

/**
 * Internal-only helper for automated server tests to inspect dry-run dispatches without exposing tokens over HTTP.
 */
export function getDevMailOutboxForTesting(): ReadonlyArray<CapturedEmailPreview> {
  return globalForMailPreview.__streetwatchDevOutbox || [];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Lightweight RFC-5321 SMTP client using Node built-in net/tls sockets (AUTH LOGIN / STARTTLS).
 * Avoids unnecessary third-party mail dependencies while supporting standard SMTP servers via env vars.
 */
async function sendViaSmtp(
  msg: EmailMessage,
  config: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  }
): Promise<void> {
  const isImplicitTls = config.port === 465;

  return new Promise((resolve, reject) => {
    let socket: net.Socket | tls.TLSSocket = isImplicitTls
      ? tls.connect({ host: config.host, port: config.port, servername: config.host })
      : net.createConnection({ host: config.host, port: config.port });

    let buffer = "";
    let step = "GREETING";
    let closed = false;

    const timeout = setTimeout(() => {
      if (!closed) {
        closed = true;
        socket.destroy();
        reject(new Error("SMTP connection timed out"));
      }
    }, 10000);

    const finish = (err?: Error) => {
      if (closed) return;
      closed = true;
      clearTimeout(timeout);
      try {
        socket.end();
      } catch {
        // ignore close errors
      }
      if (err) reject(err);
      else resolve();
    };

    const writeCmd = (cmd: string) => {
      socket.write(`${cmd}\r\n`);
    };

    const boundary = `sw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const fromEmailMatch = config.from.match(/<([^>]+)>/);
    const envelopeFrom = fromEmailMatch ? fromEmailMatch[1] : config.from;

    const handleLine = (code: number, rawResponse: string) => {
      if (code >= 400) {
        finish(new Error(`SMTP error ${code}: ${rawResponse.slice(0, 120)}`));
        return;
      }

      switch (step) {
        case "GREETING":
          step = "EHLO";
          writeCmd(`EHLO streetwatch.local`);
          break;
        case "EHLO":
          if (!isImplicitTls && config.port === 587 && rawResponse.toUpperCase().includes("STARTTLS")) {
            step = "STARTTLS";
            writeCmd("STARTTLS");
          } else if (config.user) {
            step = "AUTH_LOGIN";
            writeCmd("AUTH LOGIN");
          } else {
            step = "MAIL_FROM";
            writeCmd(`MAIL FROM:<${sanitizeHeaderValue(envelopeFrom)}>`);
          }
          break;
        case "STARTTLS": {
          const upgraded = tls.connect({
            socket,
            host: config.host,
            servername: config.host,
          });
          socket = upgraded;
          attachListeners(upgraded);
          step = "EHLO_TLS";
          writeCmd("EHLO streetwatch.local");
          break;
        }
        case "EHLO_TLS":
          if (config.user) {
            step = "AUTH_LOGIN";
            writeCmd("AUTH LOGIN");
          } else {
            step = "MAIL_FROM";
            writeCmd(`MAIL FROM:<${sanitizeHeaderValue(envelopeFrom)}>`);
          }
          break;
        case "AUTH_LOGIN":
          step = "AUTH_USER";
          writeCmd(Buffer.from(config.user, "utf8").toString("base64"));
          break;
        case "AUTH_USER":
          step = "AUTH_PASS";
          writeCmd(Buffer.from(config.password, "utf8").toString("base64"));
          break;
        case "AUTH_PASS":
          step = "MAIL_FROM";
          writeCmd(`MAIL FROM:<${sanitizeHeaderValue(envelopeFrom)}>`);
          break;
        case "MAIL_FROM":
          step = "RCPT_TO";
          writeCmd(`RCPT TO:<${sanitizeHeaderValue(msg.to)}>`);
          break;
        case "RCPT_TO":
          step = "DATA_CMD";
          writeCmd("DATA");
          break;
        case "DATA_CMD": {
          step = "DATA_BODY";
          const headers = [
            `From: ${sanitizeHeaderValue(config.from)}`,
            `To: ${sanitizeHeaderValue(msg.to)}`,
            `Subject: ${sanitizeHeaderValue(msg.subject)}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/alternative; boundary="${boundary}"`,
            ``,
            `--${boundary}`,
            `Content-Type: text/plain; charset="utf-8"`,
            ``,
            msg.text,
            ``,
            `--${boundary}`,
            `Content-Type: text/html; charset="utf-8"`,
            ``,
            msg.html,
            ``,
            `--${boundary}--`,
            `.`,
          ].join("\r\n");
          socket.write(`${headers}\r\n`);
          break;
        }
        case "DATA_BODY":
          step = "QUIT";
          writeCmd("QUIT");
          break;
        case "QUIT":
          finish();
          break;
        default:
          finish();
      }
    };

    const attachListeners = (sock: net.Socket | tls.TLSSocket) => {
      sock.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split("\r\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line) continue;
          // Final line of SMTP reply has space after 3-digit code (e.g. "250 OK")
          const match = line.match(/^(\d{3})(\s|-)(.*)$/);
          if (match && match[2] === " ") {
            handleLine(Number(match[1]), buffer + line);
          }
        }
      });

      sock.on("error", (err) => finish(err));
    };

    attachListeners(socket);
  });
}

/**
 * Send a transactional email using SMTP environment variables when configured,
 * or safely dry-run in local development mode without leaking credentials.
 */
export async function sendTransactionalEmail(msg: EmailMessage): Promise<EmailSendResult> {
  const host = process.env.EMAIL_HOST?.trim();
  const port = Number(process.env.EMAIL_PORT || "587");
  const user = process.env.EMAIL_USER?.trim() || "";
  const password = process.env.EMAIL_PASSWORD || "";
  const from = process.env.EMAIL_FROM?.trim() || "StreetWatch <no-reply@streetwatch.local>";

  if (!host || host === "smtp.example.com") {
    recordDevPreview(msg);
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[StreetWatch Email Abstraction] SMTP not configured; dry-run email prepared (${msg.subject}).`
      );
    }
    return { delivered: true, transport: "dev-dry-run" };
  }

  await sendViaSmtp(msg, { host, port, user, password, from });
  return { delivered: true, transport: "smtp" };
}

export function buildPasswordResetEmail(params: {
  recipientName: string;
  resetUrl: string;
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(params.recipientName || "StreetWatch Resident");
  const safeUrl = escapeHtml(params.resetUrl);
  const subject = "Reset your StreetWatch password";

  const text = [
    `StreetWatch — Civic Action & AI Prioritization Platform`,
    ``,
    `Hello ${params.recipientName || "StreetWatch Resident"},`,
    ``,
    `We received a request to reset the password for your StreetWatch account.`,
    `Use the secure link below to choose a new password (valid for ${params.expiresMinutes} minutes):`,
    ``,
    params.resetUrl,
    ``,
    `If you did not request this password reset, you can safely ignore this email.`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:24px;background-color:#F7F9FC;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#101828;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E4E7EC;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="padding:24px 28px;border-bottom:1px solid #E4E7EC;background:#0B1120;color:#FFFFFF;">
        <div style="font-size:16px;font-weight:800;letter-spacing:-0.01em;">StreetWatch</div>
        <div style="font-size:12px;color:#94A3B8;margin-top:2px;">Autonomous Civic Action &amp; AI Triage Platform</div>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#101828;">Reset your StreetWatch password</h1>
        <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#344054;">
          Hello ${safeName}, we received a request to reset the password associated with your StreetWatch account.
        </p>
        <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#344054;">
          Click the button below to choose a new password. This link expires automatically in <strong>${params.expiresMinutes} minutes</strong> and can only be used once.
        </p>
        <div style="margin:0 0 24px 0;">
          <a href="${safeUrl}" style="display:inline-block;padding:12px 24px;background-color:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;border-radius:10px;">
            Reset Password
          </a>
        </div>
        <p style="margin:0 0 16px 0;font-size:12px;line-height:1.6;color:#667085;">
          If the button above does not work, copy and paste this link into your browser:<br />
          <a href="${safeUrl}" style="color:#2563EB;word-break:break-all;">${safeUrl}</a>
        </p>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E4E7EC;font-size:12px;line-height:1.6;color:#667085;">
          If you did not request this password reset, you can safely ignore this email. Your existing password remains unchanged.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

export function buildEmailVerificationEmail(params: {
  recipientName: string;
  verifyUrl: string;
  expiresHours: number;
}): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(params.recipientName || "StreetWatch Resident");
  const safeUrl = escapeHtml(params.verifyUrl);
  const subject = "Verify your StreetWatch email address";

  const text = [
    `StreetWatch Account Verification`,
    ``,
    `Hello ${params.recipientName || "StreetWatch Resident"},`,
    `Verify your email address by visiting this single-use link (valid for ${params.expiresHours} hours):`,
    params.verifyUrl,
    ``,
    `If you did not request verification, you can safely ignore this email.`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${subject}</title></head>
<body style="margin:0;padding:24px;background-color:#F7F9FC;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#101828;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E4E7EC;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="padding:24px 28px;border-bottom:1px solid #E4E7EC;background:#0B1120;color:#FFFFFF;">
        <div style="font-size:16px;font-weight:800;">StreetWatch</div>
        <div style="font-size:12px;color:#94A3B8;margin-top:2px;">Municipal Account Verification</div>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#101828;">Verify your email address</h1>
        <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#344054;">
          Hello ${safeName}, please confirm that this email belongs to your StreetWatch account. This single-use link expires in ${params.expiresHours} hours.
        </p>
        <div style="margin:0 0 24px 0;">
          <a href="${safeUrl}" style="display:inline-block;padding:12px 24px;background-color:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;border-radius:10px;">
            Verify Email Address
          </a>
        </div>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#667085;">
          If you did not request this verification, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
