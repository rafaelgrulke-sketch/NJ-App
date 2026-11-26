import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { WeeklyInformativoVideo } from '../../types/church';
import { isSafeMediaUrl } from '../../utils/mediaUpload';
import { safeYoutubeId } from '../../utils/security';

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const mins = Math.floor(sec / 60);
  const rem = Math.floor(sec % 60);
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

interface InformativoVideoPlayerProps {
  informativo: WeeklyInformativoVideo;
  autoPlay?: boolean;
}

export const InformativoVideoPlayer: React.FC<InformativoVideoPlayerProps> = ({
  informativo,
  autoPlay = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const hasNativeVideo =
    (informativo.mediaType === 'server_video' || informativo.mediaType === 'external_video') &&
    isSafeMediaUrl(informativo.videoUrl);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoError, setVideoError] = useState(false);

  // Trigger muted autoplay cleanly whenever entering Programação or changing video source
  useEffect(() => {
    setVideoError(false);
    setIsMuted(true);
    if (!hasNativeVideo) {
      setIsPlaying(autoPlay);
      return;
    }
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    if (autoPlay) {
      const attempt = el.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [hasNativeVideo, informativo.videoUrl, autoPlay]);

  const togglePlay = () => {
    if (hasNativeVideo && videoRef.current) {
      if (videoRef.current.paused) {
        void videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    // YouTube IFrame postMessage API fallback controls (explicit targetOrigin)
    if (iframeRef.current?.contentWindow) {
      const func = isPlaying ? 'pauseVideo' : 'playVideo';
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args: [] }),
        'https://www.youtube.com'
      );
      setIsPlaying((prev) => !prev);
    }
  };

  const toggleMute = () => {
    if (hasNativeVideo && videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      return;
    }

    if (iframeRef.current?.contentWindow) {
      const func = isMuted ? 'unMute' : 'mute';
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args: [] }),
        'https://www.youtube.com'
      );
      setIsMuted((prev) => !prev);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (videoRef.current && Number.isFinite(val)) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleFullscreen = () => {
    const target = videoRef.current || iframeRef.current;
    if (target && target.requestFullscreen) {
      void target.requestFullscreen();
    }
  };

  const poster = isSafeMediaUrl(informativo.posterUrl) ? informativo.posterUrl : undefined;

  if (hasNativeVideo && !videoError) {
    return (
      <div className="group relative aspect-video w-full overflow-hidden bg-[#101A14]">
        <video
          ref={videoRef}
          src={informativo.videoUrl}
          poster={poster}
          autoPlay={autoPlay}
          muted={isMuted}
          loop
          playsInline
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onError={() => setVideoError(true)}
          onClick={togglePlay}
          className="h-full w-full cursor-pointer object-cover"
          aria-label={informativo.title}
        />

        {/* Quick 1-Tap Unmute Pill when Autoplaying Muted */}
        {isMuted && (
          <button
            type="button"
            onClick={toggleMute}
            className="absolute top-3.5 right-3.5 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#B1D3AE] px-3.5 py-2 text-xs font-semibold text-[#1A2920] shadow-lg transition hover:bg-[#C2DFC0] active:scale-95"
          >
            <VolumeX className="h-4 w-4" aria-hidden="true" />
            Ativar som
          </button>
        )}

        {/* Measured Contrast Scrim + Native Playback Controls */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0D1611]/95 via-[#0D1611]/60 to-transparent px-4 pt-10 pb-3.5 text-[#F3F1E9]">
          {duration > 0 && (
            <div className="mb-2.5 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                aria-label="Progresso do vídeo do Informativo NJ"
                className="h-1.5 w-full cursor-pointer accent-[#B1D3AE]"
              />
              <span className="font-mono text-[11px] text-[#F3F1E9]/85 tabular-nums whitespace-nowrap">
                {formatSeconds(currentTime)} / {formatSeconds(duration)}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#F3F1E9]/14 px-3 py-1.5 text-xs font-semibold text-[#F3F1E9] backdrop-blur-sm transition hover:bg-[#F3F1E9]/24"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Reproduzir
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Ativar som do vídeo' : 'Mutar vídeo'}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition ${
                  isMuted
                    ? 'bg-[#B1D3AE] text-[#1A2920] hover:bg-[#C2DFC0]'
                    : 'bg-[#F3F1E9]/14 text-[#F3F1E9] hover:bg-[#F3F1E9]/24'
                }`}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="h-4 w-4" aria-hidden="true" />
                    Mudo
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" aria-hidden="true" />
                    Com som
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleFullscreen}
              aria-label="Tela cheia"
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg bg-[#F3F1E9]/14 text-[#F3F1E9] backdrop-blur-sm transition hover:bg-[#F3F1E9]/24"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#101A14]">
      <div className="relative aspect-video w-full flex-1 bg-[#101A14]">
        {videoError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#16231B]/95 p-6 text-center text-[#F3F1E9]">
            <AlertTriangle className="h-7 w-7 text-[#F5B971]" aria-hidden="true" />
            <p className="font-display text-base font-semibold">
              Não foi possível reproduzir o arquivo de vídeo
            </p>
            <p className="max-w-sm text-xs text-[#F3F1E9]/75">
              Verifique se o vídeo enviado está em formato MP4 ou WebM válido no Painel Administrativo.
            </p>
            <button
              type="button"
              onClick={() => setVideoError(false)}
              className="nj-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Tentar novamente
            </button>
          </div>
        )}

        <iframe
          ref={iframeRef}
          title={informativo.title}
          src={`https://www.youtube.com/embed/${safeYoutubeId(informativo.youtubeId) || 'dQw4w9WgXcQ'}?autoplay=${autoPlay ? 1 : 0}&mute=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1`}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Unified Pause & Mute Control Bar for YouTube Mode too */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--nj-border)] bg-[#15211A] px-4 py-2.5 text-[#F3F1E9]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[#F3F1E9]/12 px-3 py-1.5 text-xs font-medium text-[#F3F1E9] transition hover:bg-[#F3F1E9]/22"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                Reproduzir
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              isMuted
                ? 'bg-[#B1D3AE] text-[#1A2920] hover:bg-[#C2DFC0]'
                : 'bg-[#F3F1E9]/12 text-[#F3F1E9] hover:bg-[#F3F1E9]/22'
            }`}
          >
            {isMuted ? (
              <>
                <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                Ativar som
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                Mutar
              </>
            )}
          </button>
        </div>

        <span className="text-[11px] text-[#F3F1E9]/65">
          Reprodução automática mutada · Envie um vídeo MP4 no Painel Admin para player nativo
        </span>
      </div>
    </div>
  );
};
