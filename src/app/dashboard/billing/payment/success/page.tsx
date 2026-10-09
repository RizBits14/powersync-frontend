import { PaymentSuccessView } from "@/components/dashboard/payment-success-view";

interface PageProps {
  searchParams: Promise<{
    session_id?: string | string[];
  }>;
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const sessionId = typeof params.session_id === "string" ? params.session_id : "";

  return <PaymentSuccessView sessionId={sessionId} />;
}
