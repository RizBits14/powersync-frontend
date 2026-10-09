import { CustomerBillDetailView } from "@/components/dashboard/customer-bill-detail-view";

interface CustomerBillDetailPageProps {
  params: Promise<{
    billId: string;
  }>;
}

export default async function CustomerBillDetailPage({ params }: CustomerBillDetailPageProps) {
  const { billId } = await params;

  return <CustomerBillDetailView billId={billId} />;
}
