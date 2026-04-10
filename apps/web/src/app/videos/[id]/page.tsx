import { api } from "@/lib/api-client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { VideoActions } from "@/components/video-actions";
import { Recommendations } from "@/components/recommendations";

async function getVideo(id: string) {
  const headerStore = headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const cookie = headerStore.get("cookie") ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (host ? `${protocol}://${host}` : "");

  const res = await fetch(`${baseUrl}/api/videos/${id}`, {
    headers: cookie ? { cookie } : {},
    cache: "no-store"
  });

  const json = (await res.json().catch(() => null)) as
    | { data?: { video: any; stats?: any; userState?: { liked: boolean; favored: boolean } }; message?: string }
    | null;

  return {
    status: res.status,
    data: json?.data,
    message: json?.message
  };
}

const Comments = dynamic(() => import("@/components/comments").then((m) => m.Comments), {
  ssr: false
});

const Player = dynamic(() => import("@/components/player"), { ssr: false });

export default async function VideoPage({ params }: { params: { id: string } }) {
  const result = await getVideo(params.id).catch(() => null);
  if (!result) {
    return (
      <main>
        <div className="card">视频加载失败，请稍后重试。</div>
      </main>
    );
  }
  if (result.status === 404) return notFound();
  if (result.status === 403) {
    return (
      <main>
        <div className="card">
          当前视频尚未公开或你没有访问权限。<Link href="/">返回首页</Link>
        </div>
      </main>
    );
  }
  if (!result.data?.video) {
    return (
      <main>
        <div className="card">视频加载失败，请稍后重试。</div>
      </main>
    );
  }

  const v = result.data.video;
  const liked = result.data.userState?.liked;
  const favored = result.data.userState?.favored;
  const stats = result.data.stats;
  const playable = v.status === "published" && (v.assets?.hlsUrl || v.assets?.originalUrl);

  return (
    <main>
      <div className="content" style={{ maxWidth: 1080 }}>
        <div className="player-card">
          {playable ? (
            <Player
              source={{
                url: v.assets?.hlsUrl || v.assets?.originalUrl || "",
                type: v.assets?.hlsUrl ? "m3u8" : "mp4"
              }}
            />
          ) : (
            <div className="player-shell">
              {v.status === "transcoding" && "转码中，请稍候"}
              {v.status === "review_pending" && "待审核，暂不可播放"}
              {v.status === "uploading" && "上传中，暂不可播放"}
              {v.status !== "transcoding" && v.status !== "review_pending" && v.status !== "uploading" && "暂无可播放源"}
            </div>
          )}
          <div className="player-meta">
            <h1>{v.title}</h1>
            <div className="hint">作者：{v.author?.username ?? "未知"}</div>
            <div className="hint">分类：{v.category?.name ?? "未分类"}</div>
            <div className="hint">状态：{v.status}</div>
            <div className="player-stats">
              <div className="player-stat-card">
                <span className="player-stat-value">{stats?.likes ?? 0}</span>
                <span className="player-stat-label">点赞</span>
              </div>
              <div className="player-stat-card">
                <span className="player-stat-value">{stats?.favorites ?? 0}</span>
                <span className="player-stat-label">收藏</span>
              </div>
              <div className="player-stat-card">
                <span className="player-stat-value">{stats?.comments ?? 0}</span>
                <span className="player-stat-label">评论</span>
              </div>
            </div>
            {v.description && <p style={{ marginTop: 12 }}>{v.description}</p>}
            <div style={{ marginTop: 12 }}>
              <VideoActions videoId={params.id} initialLiked={liked} initialFavored={favored} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>相关推荐</h2>
          <Recommendations videoId={params.id} />
        </div>

        <Comments videoId={params.id} />

        <Link href="/">返回首页</Link>
      </div>
    </main>
  );
}
