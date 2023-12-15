import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomerById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Update Customer',
};

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const customer = await fetchCustomerById(id);

  if(!customer) {
    notFound();
  }
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/invoices' },
          {
            label: 'Edit Customer',
            href: `/dashboard/customers/${id}/edit`,
            active: true,
          },
        ]}
      />
      
    </main>
  );
}
