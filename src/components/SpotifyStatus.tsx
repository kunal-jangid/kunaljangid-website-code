import React, { useState, useEffect } from 'react';

interface Track {
  songName: string;
  artistName: string;
  coverUrl?: string;
  songUrl?: string;
}

interface SpotifyData {
  isPlaying: boolean;
  songName?: string;
  artistName?: string;
  coverUrl?: string;
  songUrl?: string;
  tracks?: Track[];
}

interface SpotifyStatusProps {
  initialData?: SpotifyData | null;
}

export default function SpotifyStatus({ initialData = null }: SpotifyStatusProps) {
  const [data, setData] = useState<SpotifyData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);

  const playlistUrl = "https://music.youtube.com/playlist?list=PLVGnlnIiWk4CPQyq7Z8hlWG2Xqx3dQP0R";
  const workerEndpoint = 'https://spotify-telemetry.kunaljangid2k3.workers.dev';

  useEffect(() => {
    // If running locally, skip client-side polling to avoid browser CORS warnings
    const isLocalhost = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      if (initialData) {
        setData(initialData);
      }
      setLoading(false);
      return;
    }

    async function fetchSpotify() {
      try {
        const res = await fetch(workerEndpoint);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed fetching Spotify telemetry data", err);
        // Fallback to initial server data if client fetch fails
        if (initialData) {
          setData(initialData);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSpotify();
  }, [initialData]);

  if (loading) {
    return (
      <div className="font-mono text-xs opacity-70 leading-relaxed w-full h-full flex items-center justify-center min-h-[140px]">
        <span className="opacity-50 animate-pulse">• Synchronizing telemetry...</span>
      </div>
    );
  }

  const isPlaying = data?.isPlaying;
  const targetLink = (isPlaying && data?.songUrl) ? data.songUrl : playlistUrl;
  const hoverText = isPlaying
    ? "Wanna listen along on Spotify?\n\nClick to open track"
    : "Track paused. Open playlist on YouTube Music?\n\nClick here";

  return (
    <div className="w-full h-full flex flex-col justify-between group/card select-none text-left">
      <div className="w-full">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 opacity-90">The Sounds</h3>
        
        {/* Active Player Module */}
        <div className="relative group/player rounded-xl p-3 bg-brand-text/5 hover:bg-brand-text/10 transition-all duration-300 border border-brand-border/10 overflow-hidden">
          <div className="font-mono text-xs opacity-70 leading-relaxed w-full">
            {data ? (
              <div className={`flex items-center gap-4 ${!isPlaying ? 'opacity-70' : ''}`}>
                {data.coverUrl && (
                  <img
                    src={data.coverUrl}
                    alt="Album Artwork"
                    className="w-14 h-14 object-cover flex-shrink-0 border border-brand-border/40 filter grayscale contrast-110 dark:grayscale-0 transition-all duration-300 rounded shadow-sm"
                  />
                )}
                <div className="min-w-0 flex flex-col justify-center text-left">
                  {isPlaying ? (
                    <span className="text-brand-accent animate-pulse font-bold text-[9px] uppercase tracking-widest block mb-0.5">• Live Now</span>
                  ) : (
                    <span className="opacity-50 text-[9px] uppercase tracking-widest block mb-0.5">• Last Played</span>
                  )}
                  <h4 className="font-bold text-sm tracking-tight truncate text-brand-text mb-0.5">
                    {data.songName}
                  </h4>
                  <p className="text-xs opacity-80 truncate text-brand-text">by {data.artistName}</p>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <span className="opacity-50">• Currently Offline</span>
                <br />
                <span className="text-xs font-mono">Idle // Rotation List Enabled</span>
              </div>
            )}
          </div>

          <a
            href={targetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-brand-text text-brand-bg opacity-0 group-hover/player:opacity-100 transition-opacity duration-200 flex items-center justify-center p-2 text-center font-bold text-xs tracking-tight no-underline whitespace-pre-line"
          >
            {hoverText}
          </a>
        </div>
      </div>

      {/* Recommended Top Tracks Section */}
      {data?.tracks && data.tracks.length > 0 && (
        <div className="mt-4 border-t border-brand-border/20 pt-4 w-full">
          <span className="text-[9px] font-mono uppercase tracking-widest opacity-60 block mb-2 font-bold">Top Recommendations</span>
          <div className="space-y-1 max-h-44 overflow-y-auto pr-1 no-scrollbar">
            {data.tracks.slice(0, 5).map((track, i) => (
              <a
                key={i}
                href={track.songUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:bg-brand-text/5 p-1 rounded-lg transition-colors group/track border border-transparent hover:border-brand-border/20"
              >
                {track.coverUrl ? (
                  <img
                    src={track.coverUrl}
                    className="w-7 h-7 object-cover rounded filter grayscale group-hover/track:grayscale-0 transition-all"
                    alt=""
                  />
                ) : (
                  <div className="w-7 h-7 bg-brand-text/10 rounded flex items-center justify-center text-xs">🎵</div>
                )}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold truncate group-hover/track:text-brand-accent transition-colors text-brand-text">
                    {track.songName}
                  </h4>
                  <p className="text-[9px] opacity-75 truncate text-brand-text">by {track.artistName}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
