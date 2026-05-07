export type InvoiceStatusLabel = "Paid" | "Unpaid" | "Partial" | "Overdue";

export type InvoiceRow = {
    id: string;
    customerName: string;
    customerContact: string;
    customerInitials: string;
    customerColor: string;
    amount: number;
    startDate: string;
    endDate: string;
    sentDate: string;
    statusLabel: InvoiceStatusLabel;
};
