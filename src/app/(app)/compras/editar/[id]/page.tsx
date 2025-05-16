import ManageCompraClientPage from '@/app/compras/components/ManageCompraClientPage'; // Adjusted import path

export default function EditarCompraPage({ params }: { params: { id: string } }) {
  return <ManageCompraClientPage compraId={params.id} />;
}
