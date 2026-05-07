import { redirect } from "next/navigation";

export default async function CustomerEdit({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/customer/${id}`);
}
