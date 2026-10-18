import { BookmarkSimple as Bookmark } from '@phosphor-icons/react';
import { useBookmarks } from '../hooks/useBookmarks';

export function BookmarkButton({ itemType, itemId, className = '' }) {
  const { isBookmarked, toggle } = useBookmarks();
  if (itemId == null) return null;
  const active = isBookmarked(itemType, itemId);
  return (
    <button
      type="button"
      aria-label={active ? 'Remove bookmark' : 'Save bookmark'}
      title={active ? 'Remove bookmark' : 'Save for later'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(itemType, itemId);
      }}
      className={`inline-flex h-7 w-7 items-center justify-center border transition-colors ${
        active
          ? 'border-accent/40 bg-accent/10 text-accent'
          : 'border-line bg-surface text-accent hover:border-accent/50 hover:bg-accent/5'
      } ${className}`}
    >
      <Bookmark size={15} weight={active ? 'fill' : 'regular'} color="#0B5497" />
    </button>
  );
}
