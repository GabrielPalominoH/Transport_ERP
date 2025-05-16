import ManageCompraClientPage from '../../components/ManageCompraClientPage';

export default function EditarCompraPage({ params }: { params: { id: string } }) {
  return <ManageCompraClientPage compraId={params.id} />;
}
