import { redirect } from "next/navigation";

type InvoiceEditRouteProps = {
    params: Promise<{ id: string }>;
};

export default async function InvoiceEditRoute({ params }: InvoiceEditRouteProps) {
    const { id } = await params;
    redirect(`/invoice/${id}`);
}
