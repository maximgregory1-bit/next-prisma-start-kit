import { CustomerEditPage } from "@/features/customer/components";

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <CustomerEditPage customerId={id} initialEditable />;
}
