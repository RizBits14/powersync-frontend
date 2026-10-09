import { CustomerOutageDetailView } from "@/components/dashboard/customer-outage-detail-view";

interface CustomerOutageDetailPageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default async function CustomerOutageDetailPage({ params }: CustomerOutageDetailPageProps) {
  const { reportId } = await params;

  return <CustomerOutageDetailView reportId={reportId} />;
}
