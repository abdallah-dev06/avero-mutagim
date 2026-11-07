import { PageHeader } from "@/components/admin/admin-shell";
import { ProductEditor } from "@/components/admin/product-editor";
import { EMPTY_EDITOR, editorOptions } from "@/server/admin-products";

export const metadata = { title: "منتج جديد" };

export default async function NewProductPage() {
  const opts = await editorOptions();
  return (
    <div>
      <PageHeader title="منتج جديد" description="7 خطوات بسيطة — يمكنك الحفظ كمسودة في أي وقت." />
      <ProductEditor initial={EMPTY_EDITOR} {...opts} />
    </div>
  );
}
