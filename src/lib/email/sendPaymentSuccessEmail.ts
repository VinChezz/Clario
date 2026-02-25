import { emailTemplates, sendEmail } from "./sendEmail";

export async function sendPaymentSuccessEmail({
  to,
  customerName,
  planName,
  amount,
  date,
  transactionId,
  downloadLink,
}: {
  to: string;
  customerName: string;
  planName: string;
  amount: string;
  date: string;
  transactionId: string;
  downloadLink?: string;
}) {
  const template = emailTemplates.paymentSuccess({
    customerName,
    planName,
    amount,
    date,
    transactionId,
    downloadLink,
  });

  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
