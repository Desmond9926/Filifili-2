import { CategoryList } from "@/components/category-list";

export default function CategoriesPage() {
  return (
    <main>
      <div className="card" style={{ maxWidth: 840 }}>
        <h1>分类</h1>
        <CategoryList />
      </div>
    </main>
  );
}
