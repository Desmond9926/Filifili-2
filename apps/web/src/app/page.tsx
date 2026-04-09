import { CategoryList } from "@/components/category-list";
import { VideoList } from "@/components/video-list";

export default function HomePage() {
  return (
    <main>
      <div className="content">
        <div className="card" style={{ marginBottom: 4 }}>
          <h1>Filifili</h1>
          <p className="hint">发现最新视频，也可以直接浏览当前最受欢迎的内容。</p>
          <div style={{ marginTop: 12 }}>
            <CategoryList />
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 12 }}>最新发布</h2>
          <VideoList sort="latest" />
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>热门推荐</h2>
            <span className="hint">按点赞、收藏、评论热度综合排序</span>
          </div>
          <VideoList sort="hot" />
        </div>
      </div>
    </main>
  );
}
