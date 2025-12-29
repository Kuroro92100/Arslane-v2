import { useEffect, useState } from "react";
import { Play, Clock, User, Eye } from "lucide-react";

interface VideoPreviewProps {
  url: string;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  channelName: string;
  videoId: string;
}

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const VideoPreview = ({ url }: VideoPreviewProps) => {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      setVideoInfo(null);
      return;
    }

    setLoading(true);

    // Use YouTube's oEmbed API (no API key required)
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      .then((res) => res.json())
      .then((data) => {
        setVideoInfo({
          title: data.title,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          channelName: data.author_name,
          videoId,
        });
      })
      .catch(() => {
        // Fallback: just show thumbnail without title
        setVideoInfo({
          title: "Vidéo YouTube",
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          channelName: "YouTube",
          videoId,
        });
      })
      .finally(() => setLoading(false));
  }, [url]);

  if (!videoInfo || loading) {
    return null;
  }

  return (
    <div className="mt-4 animate-fade-in">
      <div className="bg-secondary/50 rounded-xl overflow-hidden border border-border">
        <div className="relative group">
          <img
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={`https://www.youtube.com/watch?v=${videoInfo.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-primary/90 hover:bg-primary transition-colors"
            >
              <Play className="w-8 h-8 text-white fill-white" />
            </a>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
            {videoInfo.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{videoInfo.channelName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
