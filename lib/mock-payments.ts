export type PaymentStatus = "completed" | "pending" | "failed";

export type PaymentTimelineStep = {
  label: string;
  at: string;
  note?: string;
};

export type PaymentRecord = {
  id: string;
  readableId: string;
  sessionId: string;
  sessionTopic: string;
  amountBdt: number;
  method: "bkash" | "nagad" | "card";
  status: PaymentStatus;
  trxId: string;
  paidAt: string;
  sessionDate: string;
  mentorName: string;
  timeline: PaymentTimelineStep[];
};

/** Replace with apiFetch when payments API is available. */
export const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: "pay-001",
    readableId: "PAY-240501",
    sessionId: "SES-240501",
    sessionTopic: "Data Structures — Trees",
    amountBdt: 1200,
    method: "bkash",
    status: "completed",
    trxId: "BK7X9K2M4P",
    paidAt: "2026-05-10T14:22:00",
    sessionDate: "2026-05-12",
    mentorName: "Rahim U.",
    timeline: [
      { label: "Payment submitted", at: "2026-05-10T14:20:00" },
      { label: "Under review", at: "2026-05-10T14:21:00" },
      { label: "Confirmed", at: "2026-05-10T14:22:00", note: "Meeting access enabled" },
    ],
  },
  {
    id: "pay-002",
    readableId: "PAY-240502",
    sessionId: "SES-240502",
    sessionTopic: "Calculus II — Integration",
    amountBdt: 1500,
    method: "nagad",
    status: "pending",
    trxId: "NG3H8J1L6Q",
    paidAt: "2026-05-14T09:15:00",
    sessionDate: "2026-05-16",
    mentorName: "Pending assignment",
    timeline: [
      { label: "Payment submitted", at: "2026-05-14T09:15:00" },
      { label: "Awaiting admin confirmation", at: "2026-05-14T09:16:00" },
    ],
  },
  {
    id: "pay-003",
    readableId: "PAY-240503",
    sessionId: "SES-240503",
    sessionTopic: "Organic Chemistry Lab",
    amountBdt: 1800,
    method: "bkash",
    status: "failed",
    trxId: "BK2INVALID",
    paidAt: "2026-05-08T11:40:00",
    sessionDate: "2026-05-09",
    mentorName: "Sadia K.",
    timeline: [
      { label: "Payment submitted", at: "2026-05-08T11:40:00" },
      { label: "Verification failed", at: "2026-05-08T12:05:00", note: "TrxID could not be verified" },
    ],
  },
  {
    id: "pay-004",
    readableId: "PAY-240504",
    sessionId: "SES-240504",
    sessionTopic: "Microeconomics — Market Structures",
    amountBdt: 1200,
    method: "bkash",
    status: "completed",
    trxId: "BK5M3N8P1R",
    paidAt: "2026-05-01T16:30:00",
    sessionDate: "2026-05-03",
    mentorName: "Karim H.",
    timeline: [
      { label: "Payment submitted", at: "2026-05-01T16:28:00" },
      { label: "Confirmed", at: "2026-05-01T16:30:00" },
    ],
  },
  {
    id: "pay-005",
    readableId: "PAY-240505",
    sessionId: "SES-240505",
    sessionTopic: "Python — OOP Basics",
    amountBdt: 1000,
    method: "nagad",
    status: "completed",
    trxId: "NG9K4L2M7S",
    paidAt: "2026-04-28T10:00:00",
    sessionDate: "2026-04-30",
    mentorName: "Nadia T.",
    timeline: [
      { label: "Payment submitted", at: "2026-04-28T09:58:00" },
      { label: "Confirmed", at: "2026-04-28T10:00:00" },
    ],
  },
  {
    id: "pay-006",
    readableId: "PAY-240506",
    sessionId: "SES-240506",
    sessionTopic: "English Composition",
    amountBdt: 900,
    method: "bkash",
    status: "pending",
    trxId: "BK1P8Q3R6T",
    paidAt: "2026-05-15T18:45:00",
    sessionDate: "2026-05-18",
    mentorName: "Assigned",
    timeline: [
      { label: "Payment submitted", at: "2026-05-15T18:45:00" },
      { label: "Awaiting admin confirmation", at: "2026-05-15T18:46:00" },
    ],
  },
  {
    id: "pay-007",
    readableId: "PAY-240507",
    sessionId: "SES-240507",
    sessionTopic: "Linear Algebra — Matrices",
    amountBdt: 1300,
    method: "card",
    status: "completed",
    trxId: "CARD-88421",
    paidAt: "2026-04-20T13:10:00",
    sessionDate: "2026-04-22",
    mentorName: "Imran S.",
    timeline: [
      { label: "Payment submitted", at: "2026-04-20T13:08:00" },
      { label: "Confirmed", at: "2026-04-20T13:10:00" },
    ],
  },
  {
    id: "pay-008",
    readableId: "PAY-240508",
    sessionId: "SES-240508",
    sessionTopic: "Physics — Mechanics",
    amountBdt: 1400,
    method: "bkash",
    status: "failed",
    trxId: "BK0WRONG99",
    paidAt: "2026-04-15T08:20:00",
    sessionDate: "2026-04-17",
    mentorName: "Farhana M.",
    timeline: [
      { label: "Payment submitted", at: "2026-04-15T08:20:00" },
      { label: "Verification failed", at: "2026-04-15T09:00:00" },
    ],
  },
  {
    id: "pay-009",
    readableId: "PAY-240509",
    sessionId: "SES-240509",
    sessionTopic: "Accounting — Financial Statements",
    amountBdt: 1600,
    method: "nagad",
    status: "completed",
    trxId: "NG2H7K9M3P",
    paidAt: "2026-04-10T11:00:00",
    sessionDate: "2026-04-12",
    mentorName: "Ashik R.",
    timeline: [
      { label: "Payment submitted", at: "2026-04-10T10:58:00" },
      { label: "Confirmed", at: "2026-04-10T11:00:00" },
    ],
  },
  {
    id: "pay-010",
    readableId: "PAY-240510",
    sessionId: "SES-240510",
    sessionTopic: "Statistics — Probability",
    amountBdt: 1100,
    method: "bkash",
    status: "pending",
    trxId: "BK6L1N4P8Q",
    paidAt: "2026-05-16T07:30:00",
    sessionDate: "2026-05-19",
    mentorName: "Pending assignment",
    timeline: [
      { label: "Payment submitted", at: "2026-05-16T07:30:00" },
      { label: "Awaiting admin confirmation", at: "2026-05-16T07:31:00" },
    ],
  },
  {
    id: "pay-011",
    readableId: "PAY-240511",
    sessionId: "SES-240511",
    sessionTopic: "Database Systems — SQL Joins",
    amountBdt: 1250,
    method: "bkash",
    status: "completed",
    trxId: "BK8Q2R5T7U",
    paidAt: "2026-03-25T15:45:00",
    sessionDate: "2026-03-27",
    mentorName: "Mehdi A.",
    timeline: [
      { label: "Payment submitted", at: "2026-03-25T15:43:00" },
      { label: "Confirmed", at: "2026-03-25T15:45:00" },
    ],
  },
  {
    id: "pay-012",
    readableId: "PAY-240512",
    sessionId: "SES-240512",
    sessionTopic: "Business Communication",
    amountBdt: 950,
    method: "nagad",
    status: "completed",
    trxId: "NG4P9K1M6S",
    paidAt: "2026-03-18T09:20:00",
    sessionDate: "2026-03-20",
    mentorName: "Lamia C.",
    timeline: [
      { label: "Payment submitted", at: "2026-03-18T09:18:00" },
      { label: "Confirmed", at: "2026-03-18T09:20:00" },
    ],
  },
];

/** Upcoming session payment due (mock). Set to null when none. */
export const MOCK_UPCOMING_DUE: { amountBdt: number; sessionTopic: string; sessionDate: string } | null = {
  amountBdt: 1200,
  sessionTopic: "Data Structures — Trees (follow-up)",
  sessionDate: "2026-05-22",
};

export function getMockPayments(): PaymentRecord[] {
  return [...MOCK_PAYMENTS].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
  );
}
