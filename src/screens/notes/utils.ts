// Shared helpers for the Notes feature.

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// On save, wrap blank-line-separated paragraphs in <p> tags so the
// API content remains HTML round-trippable with the renderer.
export function paragraphsToHtml(text: string): string {
  if (!text) return '';
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, '<br />')}</p>`)
    .join('');
}

export function snippet(html: string, max = 120): string {
  const text = stripHtml(html).replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

export function formatNoteDate(value: string): string {
  if (!value) return '';
  const d = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export const PRESET_LABEL_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6B7280', // gray
];
