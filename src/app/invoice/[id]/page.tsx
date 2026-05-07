import { InvoiceEditPage } from "@/features/invoice/components";

type InvoiceDetailRouteProps = {
    params: Promise<{ id: string }>;
};

export default async function InvoiceDetailRoute({ params }: InvoiceDetailRouteProps) {
    const { id } = await params;
    return <InvoiceEditPage invoiceId={id} initialEditable />;
}
