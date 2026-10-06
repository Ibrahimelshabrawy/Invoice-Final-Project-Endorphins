import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Undo, Redo, RemoveFormatting } from 'lucide-react';

/**
 * Strips untrusted tags and dangerous attributes from HTML.
 */
export function sanitizeRichText(html) {
  if (!html || typeof html !== 'string') return '';
  if (typeof window === 'undefined' || !window.DOMParser) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const allowedTags = new Set([
    'B', 'STRONG', 'I', 'EM', 'U', 'P', 'BR', 'UL', 'OL', 'LI', 'SPAN', 'DIV'
  ]);

  function clean(node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowedTags.has(child.tagName)) {
          const textNode = doc.createTextNode(child.textContent || '');
          node.replaceChild(textNode, child);
        } else {
          const attrs = Array.from(child.attributes);
          for (const attr of attrs) {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on') || attr.value.trim().toLowerCase().startsWith('javascript:')) {
              child.removeAttribute(attr.name);
            }
          }
          clean(child);
        }
      }
    }
  }

  clean(doc.body);
  return doc.body.innerHTML;
}

/**
 * Checks if HTML is empty (no text and no tags with content).
 */
export function isRichTextEmpty(html) {
  if (!html || typeof html !== 'string') return true;
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped.length === 0;
}

/**
 * Normalizes rich text for saving: returns null if empty, otherwise trimmed HTML.
 */
export function normalizeRichText(html) {
  if (!html || isRichTextEmpty(html)) return null;
  const trimmed = html.trim();
  return trimmed || null;
}

/**
 * Converts legacy plain text to structured HTML if needed.
 */
export function textToRichHtml(text) {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text;
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';

  const allBullets = lines.every((l) => /^[•\-\*]\s*/.test(l));
  if (allBullets) {
    const listItems = lines
      .map((l) => `<li>${l.replace(/^[•\-\*]\s*/, '')}</li>`)
      .join('');
    return `<ul>${listItems}</ul>`;
  }

  return lines.map((l) => `<p>${l}</p>`).join('');
}

/**
 * Professional TipTap-powered Rich Text Editor Component
 * Supports Bold, Italic, Bullet Lists, Numbered Lists, Undo, Redo.
 */
export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Add deliverables or scope with bullet points (e.g. Frontend Development, Backend Development...)',
  minHeight = '120px',
  disabled = false,
}) {
  const initialContent = textToRichHtml(value || '');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'tiptap-bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'tiptap-ordered-list',
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const empty = ed.isEmpty || isRichTextEmpty(html);
      onChange?.(empty ? '' : html);
    },
  });

  // Keep editor content in sync with external value prop
  useEffect(() => {
    if (!editor) return;
    const incoming = textToRichHtml(value || '');
    const current = editor.getHTML();

    if (editor.isEmpty && !incoming) return;
    if (incoming !== current) {
      editor.commands.setContent(incoming, false);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`rich-editor-wrapper ${disabled ? 'disabled' : ''}`}>
      {/* Visible Rich Text Editor Toolbar */}
      <div className="rich-editor-toolbar" role="toolbar" aria-label="Formatting options">
        <div className="rich-editor-tools">
          {/* Bold Button */}
          <button
            type="button"
            className={`rich-editor-btn ${editor.isActive('bold') ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            title="Bold"
            aria-label="Bold"
          >
            <Bold size={13} />
            <span>Bold</span>
          </button>

          {/* Italic Button */}
          <button
            type="button"
            className={`rich-editor-btn ${editor.isActive('italic') ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            title="Italic"
            aria-label="Italic"
          >
            <Italic size={13} />
            <span>Italic</span>
          </button>

          <span className="rich-editor-separator" />

          {/* Primary Requirement: Bullet List Button */}
          <button
            type="button"
            className={`rich-editor-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            title="Bullet List"
            aria-label="Bullet List"
          >
            <List size={14} />
            <span>Bullet List</span>
          </button>

          {/* Numbered List Button */}
          <button
            type="button"
            className={`rich-editor-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            title="Numbered List"
            aria-label="Numbered List"
          >
            <ListOrdered size={14} />
            <span>Numbered List</span>
          </button>

          <span className="rich-editor-separator" />

          {/* Clear Formatting */}
          <button
            type="button"
            className="rich-editor-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            disabled={disabled}
            title="Clear formatting"
            aria-label="Clear formatting"
          >
            <RemoveFormatting size={13} />
          </button>

          {/* Undo / Redo */}
          <button
            type="button"
            className="rich-editor-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="Undo"
            aria-label="Undo"
          >
            <Undo size={13} />
          </button>

          <button
            type="button"
            className="rich-editor-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="Redo"
            aria-label="Redo"
          >
            <Redo size={13} />
          </button>
        </div>

        <div className="rich-editor-hint">
          <span>Rich Text</span>
        </div>
      </div>

      {/* Editor Content Area */}
      <div style={{ minHeight }} className="rich-editor-content-container">
        <EditorContent editor={editor} />
      </div>

      {/* Footer Helper */}
      <div className="rich-editor-footer">
        <span>Click <strong>Bullet List</strong> to add formatted deliverables</span>
        <span>{editor.isEmpty ? 'Empty' : 'Formatted'}</span>
      </div>
    </div>
  );
}
