import CustomerCreateView from '@/client/views/customers/CustomerCreateView';

export const metadata = { title: 'Portal - Create Customer' };

export default function Page() {
  return <CustomerCreateView basePath="/portal/customers" />;
}
