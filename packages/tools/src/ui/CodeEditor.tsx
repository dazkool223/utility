import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { placeholder as placeholderExt } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { cn } from './lib/utils';

// Syntax colours come from CSS variables so they follow the light/dark theme (see styles.css).
const highlight = HighlightStyle.define([
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--syn-string)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--syn-number)' },
  { tag: [t.keyword, t.operatorKeyword, t.modifier, t.controlKeyword], color: 'var(--syn-keyword)' },
  { tag: [t.propertyName, t.attributeName, t.definition(t.propertyName)], color: 'var(--syn-property)' },
  { tag: [t.tagName, t.typeName, t.className], color: 'var(--syn-type)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--syn-function)' },
  { tag: [t.comment, t.meta], color: 'var(--syn-comment)', fontStyle: 'italic' },
  { tag: [t.heading], fontWeight: '600', color: 'var(--syn-keyword)' },
  { tag: [t.link, t.url], color: 'var(--syn-string)', textDecoration: 'underline' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strong, fontWeight: '600' },
  { tag: t.invalid, color: 'var(--destructive)' },
]);

export type EditorLanguage = 'json' | 'yaml' | 'xml' | 'html' | 'css' | 'javascript' | 'typescript' | 'sql' | 'markdown' | 'text';

const loaders: Record<EditorLanguage, () => Promise<Extension>> = {
  json: () => import('@codemirror/lang-json').then((m) => m.json()),
  yaml: () => import('@codemirror/lang-yaml').then((m) => m.yaml()),
  xml: () => import('@codemirror/lang-xml').then((m) => m.xml()),
  html: () => import('@codemirror/lang-html').then((m) => m.html()),
  css: () => import('@codemirror/lang-css').then((m) => m.css()),
  javascript: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  typescript: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  markdown: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
  text: async () => [],
};

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: EditorLanguage;
  readOnly?: boolean;
  placeholder?: string;
  /** Accessible name. */
  label: string;
  testId?: string;
  /** Wrap long lines (default true). */
  wrap?: boolean;
  /** Extra classes, e.g. to change the height. */
  className?: string;
}

/** CodeMirror 6 editor. Controlled: `value` is the source of truth. */
export function CodeEditor({ value, onChange, language = 'text', readOnly, placeholder, label, testId, wrap = true, className }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const langCompartment = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          syntaxHighlighting(highlight),
          langCompartment.current.of([]),
          EditorState.readOnly.of(!!readOnly),
          EditorView.editable.of(!readOnly),
          wrap ? EditorView.lineWrapping : [],
          placeholder ? placeholderExt(placeholder) : [],
          EditorView.contentAttributes.of({ 'aria-label': label }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current?.(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- editor is created once; props sync below
  }, []);

  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const current = v.state.doc.toString();
    if (current !== value) v.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    loaders[language]().then((ext) => {
      if (!cancelled) view.current?.dispatch({ effects: langCompartment.current.reconfigure(ext) });
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  return (
    <div
      className={cn('u-editor overflow-hidden rounded-lg border bg-card', className)}
      ref={host}
      data-testid={testId}
      data-readonly={readOnly ? '' : undefined}
    />
  );
}
