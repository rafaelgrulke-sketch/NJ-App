import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Film, Image as ImageIcon, Link2, Loader2, Upload, X } from 'lucide-react';
import { formatBytesPtBR, isSafeMediaUrl, uploadMediaFile } from '../../utils/mediaUpload';

/* ============================================================================
   1. BUTTON & ICON BUTTON PRIMITIVES (default, hover, active, focus, disabled, loading)
   ============================================================================ */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}) => {
  const variantClass =
    variant === 'primary'
      ? 'nj-btn-primary'
      : variant === 'secondary'
        ? 'nj-btn-secondary'
        : 'text-[var(--nj-ink-muted)] hover:text-[var(--nj-ink)] hover:bg-[#B1D3AE]/12 rounded-lg transition-colors';

  const sizeClass =
    size === 'sm'
      ? 'px-3.5 py-2 text-xs min-h-[36px]'
      : size === 'lg'
        ? 'px-6 py-3 text-sm min-h-[46px]'
        : 'px-4 py-2.5 text-sm min-h-[40px]';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  className = '',
  children,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={`nj-icon-btn ${className}`}
    {...props}
  >
    {children}
  </button>
);

/* ============================================================================
   2. ACCESSIBLE MODAL (ESC key, backdrop click, ARIA role & title binding)
   ============================================================================ */
interface AccessibleModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-2xl',
  children,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D1611]/75 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`nj-card relative flex max-h-[90vh] w-full flex-col overflow-hidden bg-[var(--nj-surface)] shadow-2xl ${maxWidthClass}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--nj-border)] px-6 py-4">
          <div className="min-w-0">
            {subtitle && (
              <p className="text-xs font-medium text-[var(--nj-accent-text)]">{subtitle}</p>
            )}
            <h3 id={titleId} className="mt-0.5 text-lg font-semibold text-[var(--nj-ink)] sm:text-xl">
              {title}
            </h3>
          </div>
          <IconButton label="Fechar janela" onClick={onClose} className="shrink-0">
            <X className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

/* ============================================================================
   3. TOOLTIP & EMPTY STATE PRIMITIVES
   ============================================================================ */
export const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({
  content,
  children,
}) => {
  const id = useId();
  return (
    <span className="group relative inline-flex" aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--nj-border-strong)] bg-[#15211A] px-2.5 py-1 text-[11px] font-medium text-[#F3F1E9] opacity-0 shadow-md transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {content}
      </span>
    </span>
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="nj-card flex flex-col items-center justify-center px-6 py-12 text-center">
    {icon && (
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--nj-border)] bg-[var(--nj-surface-muted)] text-[var(--nj-accent-text)]">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-[var(--nj-ink)]">{title}</h3>
    <p className="mt-1.5 max-w-md text-sm text-[var(--nj-ink-muted)]">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* ============================================================================
   4. MEDIA UPLOAD DROPZONE (SERVER UPLOAD WITH REAL PROGRESS + EXTERNAL URL)
   ============================================================================ */
interface MediaUploadDropzoneProps {
  kind: 'video' | 'image';
  label: string;
  value: string;
  onChange: (url: string, source: 'server' | 'external') => void;
  helperText?: string;
}

export const MediaUploadDropzone: React.FC<MediaUploadDropzoneProps> = ({
  kind,
  label,
  value,
  onChange,
  helperText,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<'upload' | 'link'>(
    value && value.startsWith('http') ? 'link' : 'upload'
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedInfo, setUploadedInfo] = useState<string | null>(null);
  const [linkDraft, setLinkDraft] = useState(value && value.startsWith('http') ? value : '');

  const accept = kind === 'video' ? 'video/mp4,video/webm' : 'image/png,image/jpeg,image/webp';

  const processFile = async (file: File) => {
    setError(null);
    setUploadedInfo(null);
    setUploading(true);
    setProgress(5);
    try {
      const res = await uploadMediaFile(kind, file, (pct) => setProgress(pct));
      setUploadedInfo(`${file.name} (${formatBytesPtBR(res.size)}) enviado ao servidor.`);
      onChange(res.url, 'server');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar o arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyExternalLink = () => {
    setError(null);
    const trimmed = linkDraft.trim();
    if (!trimmed) {
      onChange('', 'external');
      return;
    }
    if (!isSafeMediaUrl(trimmed)) {
      setError('Informe um link válido começando com https:// ou http://.');
      return;
    }
    onChange(trimmed, 'external');
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--nj-ink-muted)]">{label}</span>
        <div className="nj-tabs">
          <button
            type="button"
            onClick={() => {
              setMode('upload');
              setError(null);
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
              mode === 'upload' ? 'nj-tab-active' : 'nj-tab-idle'
            }`}
          >
            <Upload className="h-3 w-3" aria-hidden="true" />
            Upload no Servidor
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('link');
              setError(null);
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
              mode === 'link' ? 'nj-tab-active' : 'nj-tab-idle'
            }`}
          >
            <Link2 className="h-3 w-3" aria-hidden="true" />
            Link Externo
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void processFile(file);
          }}
          className={`rounded-xl border border-dashed p-4 text-center transition-colors ${
            isDragging
              ? 'border-[var(--nj-accent)] bg-[#B1D3AE]/12'
              : 'border-[var(--nj-border-strong)] bg-[var(--nj-surface-alt)]'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void processFile(file);
              e.target.value = '';
            }}
          />

          <div className="flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[var(--nj-accent-text)]" aria-hidden="true" />
            ) : kind === 'video' ? (
              <Film className="h-6 w-6 text-[var(--nj-accent-text)]" aria-hidden="true" />
            ) : (
              <ImageIcon className="h-6 w-6 text-[var(--nj-accent-text)]" aria-hidden="true" />
            )}

            <div className="space-y-0.5">
              <p className="text-xs font-medium text-[var(--nj-ink)]">
                {uploading
                  ? `Enviando para o servidor... ${progress}%`
                  : kind === 'video'
                    ? 'Arraste o vídeo do Informativo NJ ou clique para selecionar'
                    : 'Arraste a arte oficial do evento ou clique para selecionar'}
              </p>
              <p className="text-[11px] text-[var(--nj-ink-subtle)]">
                {helperText ||
                  (kind === 'video'
                    ? 'Formatos aceitos: MP4 ou WebM · Máximo 100 MB'
                    : 'Formatos aceitos: PNG, JPG ou WebP · Proporção recomendada 16:10 · Máx. 10 MB')}
              </p>
            </div>

            {uploading ? (
              <div className="mt-1 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[var(--nj-surface-muted)]">
                <div
                  className="h-full bg-[var(--nj-accent)] transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                className="mt-1"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                {value ? 'Trocar arquivo no servidor' : 'Selecionar arquivo'}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            placeholder={
              kind === 'video'
                ? 'https://servidor.com/informativo-semana.mp4'
                : 'https://servidor.com/arte-evento.jpg'
            }
            className="nj-input flex-1 text-xs"
          />
          <Button variant="secondary" size="sm" onClick={handleApplyExternalLink}>
            Aplicar link
          </Button>
        </div>
      )}

      {uploadedInfo && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--nj-success)]">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{uploadedInfo}</span>
        </p>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-[var(--nj-danger)]">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
