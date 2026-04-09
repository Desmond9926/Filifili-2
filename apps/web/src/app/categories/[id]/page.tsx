import { VideoList } from "@/components/video-list";
import { CategoryList } from "@/components/category-list";

export default function CategoryDetailPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <div className="content">
        <div className="card" style={{ marginBottom: 16 }}>
          <h1>分类下视频</h1>
          <CategoryList />
        </div>
        <VideoList categoryId={params.id} sort="latest" />
      </div>
    </main>
  );
}
