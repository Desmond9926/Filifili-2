import Link from "next/link";
import { api } from "@/lib/api-client";

export default async function UserPage({ params }: { params: { id: string } }) {
  const userRes = await api.get<{ user: any }>(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/users/${params.id}`);
  const videosRes = await api.get<{ items: any[]; total: number }>(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/users/${params.id}/videos`
  );

  const user = userRes.user;
  const videos = videosRes.items;

  return (
    <main>
      <div className="card" style={{ maxWidth: 720 }}>
        <h1>{user.username}</h1>
        <p className="hint">{user.bio || "这个人很懒，什么都没有写"}</p>
        <p className="hint">作品数：{videosRes.total}</p>
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {videos.length === 0 && <div className="hint">暂无已发布视频</div>}
          {videos.map((v) => (
            <div
              key={v.id}
              style={{
                border: "1px solid #1f2430",
                borderRadius: 10,
                padding: 12,
                background: "#0f1219"
              }}
            >
              <div style={{ fontWeight: 700 }}>{v.title}</div>
              <div className="hint">分类：{v.category?.name ?? "未分类"}</div>
              <div className="hint">状态：{v.status}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <Link href="/">返回首页</Link>
        </div>
      </div>
    </main>
  );
}
