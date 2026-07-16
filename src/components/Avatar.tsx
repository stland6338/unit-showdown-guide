/**
 * YouTubeチャンネルアイコン。必ずチャンネル/配信リンクの内側で使うこと
 * （単体掲載はREADME 絶対条件6で禁止。名前テキストが隣接する前提で装飾扱い）。
 */
export function Avatar({ src, size = 36 }: { src?: string | null; size?: number }) {
  if (!src) return null;
  return (
    <img
      className="avatar"
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
