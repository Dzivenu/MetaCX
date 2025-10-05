import CustomerDetailView from "@/client/views/customers/CustomerDetailView";

export const metadata = { title: "Admin - Customer Detail" };

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function Page(_props: PageParams) {
  return <CustomerDetailView basePath="/admin/customers" />;
}
