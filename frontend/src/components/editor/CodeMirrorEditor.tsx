import { useEffect, useRef } from "react";
import {
  EditorView,
  keymap,
  placeholder as cmPlaceholder,
} from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

export type EditorLang = "html" | "css" | "js" | "jsx";

export interface CodeMirrorEditorProps {
  value: string;
  onChange: (v: string) => void;
  language: EditorLang;
  dark: boolean;
  ariaLabel: string;
  onRun?: () => void;
  readOnly?: boolean;
  placeholder?: string;
}

const langExt = (l: EditorLang) =>
  l === "html"
    ? html()
    : l === "css"
      ? css()
      : javascript({ jsx: l === "jsx" });

/** CodeMirror 6: sintaksis rangi, qator raqamlari, avtoyopish, Ctrl+Enter — ishga tushirish */
export default function CodeMirrorEditor({
  value,
  onChange,
  language,
  dark,
  ariaLabel,
  onRun,
  readOnly,
  placeholder,
}: CodeMirrorEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  onChangeRef.current = onChange;
  onRunRef.current = onRun;
  const themeComp = useRef(new Compartment());
  const langComp = useRef(new Compartment());

  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          keymap.of([
            { key: "Mod-Enter", run: () => (onRunRef.current?.(), true) },
          ]),
          basicSetup,
          langComp.current.of(langExt(language)),
          themeComp.current.of(dark ? oneDark : []),
          EditorView.lineWrapping,
          EditorState.readOnly.of(!!readOnly),
          placeholder ? cmPlaceholder(placeholder) : [],
          EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tashqaridan qiymat o'zgarsa (reset, tab almashinuvi)
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value)
      v.dispatch({
        changes: { from: 0, to: v.state.doc.length, insert: value },
      });
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({
      effects: themeComp.current.reconfigure(dark ? oneDark : []),
    });
  }, [dark]);

  useEffect(() => {
    view.current?.dispatch({
      effects: langComp.current.reconfigure(langExt(language)),
    });
  }, [language]);

  return <div ref={host} className="h-full min-h-0 overflow-hidden" />;
}
