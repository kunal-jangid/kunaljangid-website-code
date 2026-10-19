import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';

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
      <div className="font-mono text-xs opacity-70 leading-relaxed w-full h-full flex flex-col items-center justify-center min-h-[140px] gap-2">
        <Spinner className="size-4 opacity-50 text-brand-accent" />
        <span className="opacity-50">• Synchronizing telemetry...</span>
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
        
        {/* Active Player Module */}
        <div className="relative group/player rounded-lg p-3 bg-brand-bg/60 border border-brand-border overflow-hidden transition-all duration-200">
          <div className="font-mono text-xs leading-relaxed w-full">
            {data ? (
              <div className={`flex items-center gap-3.5 ${!isPlaying ? 'opacity-70' : ''}`}>
                {data.coverUrl && (
                  <img
                    src={data.coverUrl}
                    alt="Album Artwork"
                    loading="lazy"
                    decoding="async"
                    className={`w-14 h-14 object-cover flex-shrink-0 border border-brand-border rounded transition-all duration-300 ${
                      isPlaying 
                        ? 'filter-none' 
                        : 'filter grayscale contrast-110 dark:grayscale-0'
                    }`}
                  />
                )}
                <div className="min-w-0 flex flex-col justify-center text-left">
                  {isPlaying ? (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-brand-accent font-semibold text-[9px] uppercase tracking-widest block font-mono">LIVE NOW</span>
                      <div className="flex items-end gap-[2px] h-[10px] w-[12px] pb-[1px]">
                        <span className="w-[2px] bg-brand-accent rounded-full eq-bar-1"></span>
                        <span className="w-[2px] bg-brand-accent rounded-full eq-bar-2"></span>
                        <span className="w-[2px] bg-brand-accent rounded-full eq-bar-3"></span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-brand-muted text-[9px] uppercase tracking-widest block mb-1 font-mono">LAST PLAYED</span>
                  )}
                  <h4 className="font-display font-medium text-sm tracking-tight truncate text-brand-text mb-0.5">
                    {data.songName}
                  </h4>
                  <p className="text-xs text-brand-muted truncate font-sans">by {data.artistName}</p>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <span className="text-brand-muted">• Signal Inactive</span>
                <br />
                <span className="text-xs font-mono text-brand-muted">Rotating queue active</span>
              </div>
            )}
          </div>

          <a
            href={targetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-brand-text text-brand-bg opacity-0 group-hover/player:opacity-100 transition-opacity duration-200 flex items-center justify-center p-2 text-center font-semibold text-xs tracking-tight no-underline whitespace-pre-line font-mono"
          >
            {hoverText}
          </a>
        </div>
      </div>

      {/* Recommended Top Tracks Section */}
      {data?.tracks && data.tracks.length > 0 && (
        <div className="mt-4 border-t border-brand-border/40 pt-3.5 w-full flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-muted block font-semibold">TRACK ROTATION</span>
            <span className="text-[9px] font-display italic text-brand-muted">Favorites</span>
          </div>
          <ScrollArea className="h-44 pr-1" scrollbarGutter={true}>
            <div className="space-y-1.5">
              {data.tracks.slice(0, 5).map((track, i) => (
                <a
                  key={i}
                  href={track.songUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:bg-brand-bg/80 p-1.5 rounded border border-transparent hover:border-brand-border transition-all group/track"
                >
                  {track.coverUrl ? (
                    <img
                      src={track.coverUrl}
                      loading="lazy"
                      decoding="async"
                      className="w-7 h-7 object-cover rounded border border-brand-border/60 filter grayscale group-hover/track:grayscale-0 transition-all"
                      alt=""
                    />
                  ) : (
                    <div className="w-7 h-7 bg-brand-surface border border-brand-border rounded flex items-center justify-center text-xs">🎵</div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium truncate group-hover/track:text-brand-accent transition-colors text-brand-text font-display">
                      {track.songName}
                    </h4>
                    <p className="text-[10px] text-brand-muted truncate font-sans">by {track.artistName}</p>
                  </div>
                </a>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

