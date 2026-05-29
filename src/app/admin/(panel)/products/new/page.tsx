import Link from 'next/link';
import PageHeader from '@/components/admin/PageHeader';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <>
      <PageHeader
        title="Yeni məhsul"
        subtitle="Əsas məlumat sonra şəkillər və variantlar əlavə ediləcək."
        actions={
          <Link
            href="/admin/products"
            className="text-xs text-neutral-500 hover:text-black"
          >
            ← Siyahıya qayıt
          </Link>
        }
      />
      <ProductForm mode="create" />
    </>
  );
}
