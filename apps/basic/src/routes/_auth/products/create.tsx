import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "./-components/ProductForm";

export const Route = createFileRoute("/_auth/products/create")({
  component: CreateProductPage,
});

function CreateProductPage() {
  return <ProductForm />;
}
