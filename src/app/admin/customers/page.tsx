import CustomerListView from '@/client/views/customers/CustomerListView';

export const metadata = { title: 'Admin - Customers' };

export default function Page() {
  return <CustomerListView basePath="/admin/customers" />;
}
