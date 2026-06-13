import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "./-components/ProductForm";
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/api/product";

export const Route = createFileRoute("/_auth/products/$id/edit")({
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(Number(id)),
  });

  if (isLoading) return <div>加载中...</div>;
  if (!data) return <div>商品不存在</div>;

  return <ProductForm initialData={data} />;
}
