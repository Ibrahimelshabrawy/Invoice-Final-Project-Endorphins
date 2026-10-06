import React from 'react';
import { sanitizeRichText, textToRichHtml, isRichTextEmpty } from './RichTextEditor';

/**
 * RichTextViewer Component
 *
 * Renders stored rich-text content consistently in the frontend.
 * Accurately displays bullet lists, numbered lists, bold text, italics, and paragraphs.
 * Handles both rich HTML strings and legacy plain-text descriptions.
 */
export default function RichTextViewer({
  content = '',
  emptyPlaceholder = null,
  className = '',
  style = {},
}) {
  if (!content || isRichTextEmpty(content)) {
    if (emptyPlaceholder) {
      return (
        <span style={{ color: 'var(--text-muted)', fontSize: '12px', ...style }}>
          {emptyPlaceholder}
        </span>
      );
    }
    return null;
  }

  // Convert plain text to rich HTML if legacy string without HTML tags
  const richHtml = textToRichHtml(content);
  const cleanHtml = sanitizeRichText(richHtml);

  return (
    <div
      className={`rich-text-viewer ${className}`.trim()}
      style={style}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
