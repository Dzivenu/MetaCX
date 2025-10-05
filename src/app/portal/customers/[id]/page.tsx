import CustomerDetailView from "@/client/views/customers/CustomerDetailView";

export const metadata = { title: "Portal - Customer Detail" };

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function Page(_props: PageParams) {
  return <CustomerDetailView basePath="/portal/customers" />;
}
