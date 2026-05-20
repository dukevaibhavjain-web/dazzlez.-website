import type { EmailAdapter, SendEmailOptions } from "payload";

/**
 * Dev-only email adapter that prints emails to the dev server terminal
 * instead of actually sending them. Lets us iterate on magic-link flows,
 * password resets, order confirmations etc. with zero cost and no external
 * dependencies.
 *
 * Swap to a real adapter (Brevo / SES / Resend) once we're ready to send.
 */
export const consoleEmailAdapter: EmailAdapter = () => ({
  name: "console",
  defaultFromAddress: "noreply@dazzlez.local",
  defaultFromName: "Dazzlez (dev)",
  sendEmail: async (message: SendEmailOptions) => {
    const separator = "═".repeat(72);
    console.log("\n" + separator);
    console.log("📧 EMAIL (console driver — dev only)");
    console.log(separator);
    console.log("To:      ", message.to);
    console.log("From:    ", message.from ?? "noreply@dazzlez.local");
    console.log("Subject: ", message.subject);
    if (message.html) {
      console.log("─── HTML ───────────────────────────────────────────────");
      console.log(message.html);
    }
    if (message.text) {
      console.log("─── TEXT ───────────────────────────────────────────────");
      console.log(message.text);
    }
    console.log(separator + "\n");
    return { success: true };
  },
});
