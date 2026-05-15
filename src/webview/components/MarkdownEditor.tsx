import React, { useEffect, useRef } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Annotation, ChangeSpec } from '@codemirror/state';
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  /** 마크다운 문법 하이라이팅 활성화 여부 (기본값 true) */
  enableMarkdown?: boolean;
  /** 스크린리더용 접근 이름 (CodeMirror 편집 영역에 aria-label로 연결) */
  ariaLabel?: string;
}

// 재번호 매기기 트랜잭션임을 표시 (무한 루프 방지용)
const isRenumberTx = Annotation.define<boolean>();

// ────────────────────────────────────────────────────────────────
// 문서 전체를 스캔하여 순서 있는 리스트 번호를 재산정
//
// 규칙:
//   - 같은 들여쓰기 레벨의 연속된 ordered list 항목을 하나의 블록으로 취급
//   - 더 깊은 들여쓰기(서브리스트)는 블록 연속성에 영향을 주지 않음
//   - 빈 줄 또는 같은 레벨 이상의 비-리스트 줄이 나오면 블록을 끊음
// ────────────────────────────────────────────────────────────────
function computeRenumberChanges(view: EditorView): ChangeSpec[] {
  const doc = view.state.doc;
  const changes: ChangeSpec[] = [];

  // 들여쓰기 레벨 → 현재 카운터 / 활성 블록 여부
  const counters = new Map<string, number>();
  const activeBlocks = new Set<string>();

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const match = line.text.match(/^(\s*)(\d+)\.\s/);

    if (match) {
      const indent = match[1];
      const currentNum = parseInt(match[2], 10);

      if (!activeBlocks.has(indent)) {
        // 이 들여쓰기 레벨의 새 블록 시작: 카운터 1부터
        counters.set(indent, 1);
        activeBlocks.add(indent);
      } else {
        counters.set(indent, (counters.get(indent) ?? 0) + 1);
      }

      const expectedNum = counters.get(indent)!;
      if (currentNum !== expectedNum) {
        const numStart = line.from + indent.length;
        const numEnd = numStart + match[2].length;
        changes.push({ from: numStart, to: numEnd, insert: String(expectedNum) });
      }
    } else {
      // 리스트 항목이 아닌 줄 → 해당 들여쓰기 이상 레벨의 블록 종료
      if (line.text.trim() === '') {
        // 빈 줄: 모든 레벨 초기화
        activeBlocks.clear();
        counters.clear();
      } else {
        // 비-리스트 줄: 현재 줄의 들여쓰기와 같거나 얕은 active 블록 종료
        const lineIndent = (line.text.match(/^(\s*)/) ?? ['', ''])[1];
        for (const activeIndent of [...activeBlocks]) {
          if (activeIndent.length >= lineIndent.length) {
            activeBlocks.delete(activeIndent);
            counters.delete(activeIndent);
          }
        }
      }
    }
  }

  return changes;
}

// ────────────────────────────────────────────────────────────────
// Enter 키: 마크다운 리스트 항목 자동 연속 입력
// 번호는 이 커맨드에서 +1하지만, updateListener의 재번호 매기기가
// 항상 최종 올바른 번호로 보정해줌
// ────────────────────────────────────────────────────────────────
const markdownEnterCommand = (view: EditorView): boolean => {
  const { state } = view;
  const selection = state.selection.main;

  // 멀티 선택/커서는 기본 동작 사용
  if (!selection.empty) return false;

  const line = state.doc.lineAt(selection.head);
  const lineText = line.text;

  // 체크박스 리스트 (불릿 리스트보다 먼저 매칭): `- [ ] `, `- [x] ` 패턴
  const checkboxMatch = lineText.match(/^(\s*[-*+]\s+)\[[ xX]\]\s+(.*)/);
  if (checkboxMatch) {
    const [, prefix, content] = checkboxMatch;
    if (content === '') {
      view.dispatch({ changes: { from: line.from, to: line.to, insert: '' }, selection: { anchor: line.from } });
      return true;
    }
    const insert = `\n${prefix}[ ] `;
    view.dispatch(state.update({
      changes: { from: selection.head, insert },
      selection: { anchor: selection.head + insert.length },
      scrollIntoView: true,
    }));
    return true;
  }

  // 번호 없는 리스트: `- `, `* `, `+ ` 패턴
  const unorderedMatch = lineText.match(/^(\s*)([-*+])\s+(.*)/);
  if (unorderedMatch) {
    const [, indent, bullet, content] = unorderedMatch;
    if (content === '') {
      view.dispatch({ changes: { from: line.from, to: line.to, insert: '' }, selection: { anchor: line.from } });
      return true;
    }
    const insert = `\n${indent}${bullet} `;
    view.dispatch(state.update({
      changes: { from: selection.head, insert },
      selection: { anchor: selection.head + insert.length },
      scrollIntoView: true,
    }));
    return true;
  }

  // 번호 있는 리스트: `1. `, `10. ` 패턴
  const orderedMatch = lineText.match(/^(\s*)(\d+)\.\s+(.*)/);
  if (orderedMatch) {
    const [, indent, numStr, content] = orderedMatch;
    if (content === '') {
      view.dispatch({ changes: { from: line.from, to: line.to, insert: '' }, selection: { anchor: line.from } });
      return true;
    }
    // 임시로 현재 번호 +1을 삽입; 이후 재번호 매기기가 보정함
    const nextNum = parseInt(numStr, 10) + 1;
    const insert = `\n${indent}${nextNum}. `;
    view.dispatch(state.update({
      changes: { from: selection.head, insert },
      selection: { anchor: selection.head + insert.length },
      scrollIntoView: true,
    }));
    return true;
  }

  return false;
};

// ────────────────────────────────────────────────────────────────
// CodeMirror 테마: webview 스타일에 맞게 설정
// ────────────────────────────────────────────────────────────────
const createEditorTheme = (rows: number) =>
  EditorView.theme({
    '&': {
      fontSize: '13px',
      fontFamily: 'var(--vscode-editor-font-family, "Consolas", "Courier New", monospace)',
      border: '1px solid var(--vscode-input-border, #3c3c3c)',
      borderRadius: '4px',
      backgroundColor: 'var(--vscode-input-background, #1e1e1e)',
      color: 'var(--vscode-input-foreground, #d4d4d4)',
      minHeight: `${rows * 1.5 + 0.5}em`,
    },
    '&.cm-focused': {
      outline: '1px solid var(--vscode-focusBorder, #007acc)',
      outlineOffset: '-1px',
    },
    '.cm-content': {
      padding: '6px 8px',
      caretColor: 'var(--vscode-editorCursor-foreground, #aeafad)',
      minHeight: `${rows * 1.5}em`,
    },
    '.cm-line': { lineHeight: '1.5' },
    '.cm-placeholder': {
      color: 'var(--vscode-input-placeholderForeground, #6e6e6e)',
      fontStyle: 'italic',
    },
    '.cm-scroller': { overflow: 'auto' },
    // 마크다운 하이라이트 색상
    '.tok-heading': { fontWeight: 'bold', color: '#569cd6' },
    '.tok-strong': { fontWeight: 'bold' },
    '.tok-emphasis': { fontStyle: 'italic' },
    '.tok-monospace': { color: '#ce9178', fontFamily: 'monospace' },
    '.tok-link': { color: '#3dc9b0', textDecoration: 'underline' },
    '.tok-url': { color: '#3dc9b0' },
    '.tok-punctuation': { color: '#808080' },
    '.tok-processingInstruction': { color: '#808080' },
    '.tok-contentSeparator': { color: '#808080' },
    '.tok-list': { color: '#c8c8a9' },
  });

// ────────────────────────────────────────────────────────────────
// MarkdownEditor 컴포넌트
// ────────────────────────────────────────────────────────────────
export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '',
  rows = 4,
  className = '',
  enableMarkdown = true,
  ariaLabel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  // 외부 value 변경 시 내부 업데이트 루프 방지용 플래그
  const isInternalChangeRef = useRef(false);

  // onChange 최신 참조 유지 (stale closure 방지)
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // 에디터 초기화 (마운트 시 1회)
  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      history(),
      keymap.of([
        { key: 'Enter', run: markdownEnterCommand },
        indentWithTab,
        ...historyKeymap,
        ...defaultKeymap,
      ]),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
        'aria-multiline': 'true',
      }),

      // 변경 감지 → 재번호 매기기 → React 상태 동기화
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;

        // 재번호 매기기 트랜잭션 자체에 의한 변경: React state만 업데이트하고 종료
        if (update.transactions.some(tr => tr.annotation(isRenumberTx))) {
          isInternalChangeRef.current = true;
          onChangeRef.current(update.state.doc.toString());
          return;
        }

        // 사용자 입력에 의한 변경: 재번호 매기기 적용
        const renumberChanges = computeRenumberChanges(update.view);
        if (renumberChanges.length > 0) {
          // 재번호 트랜잭션을 디스패치; 위 분기에서 React state 업데이트됨
          update.view.dispatch({
            changes: renumberChanges,
            annotations: isRenumberTx.of(true),
          });
        } else {
          // 재번호 불필요: 즉시 React state 업데이트
          isInternalChangeRef.current = true;
          onChangeRef.current(update.state.doc.toString());
        }
      }),

      ...(enableMarkdown ? [markdown()] : []),
      createEditorTheme(rows),
    ];

    const state = EditorState.create({ doc: value, extensions });
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 외부에서 value가 변경됐을 때 에디터 내용 동기화
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({ changes: { from: 0, to: currentDoc.length, insert: value } });
    }
  }, [value]);

  return <div ref={containerRef} className={`markdown-editor-wrapper ${className}`} />;
};
