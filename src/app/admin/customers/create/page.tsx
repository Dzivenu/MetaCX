import CustomerCreateView from '@/client/views/customers/CustomerCreateView';

export const metadata = { title: 'Admin - Create Customer' };

export default function Page() {
  return <CustomerCreateView basePath="/admin/customers" />;
}
