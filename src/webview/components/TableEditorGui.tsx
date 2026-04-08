import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TableEditorGuiProps {
  data: string;
  onChange: (data: string) => void;
  colWidths?: number[];
  onColWidthsChange?: (widths: number[]) => void;
}

type TableData = string[][];

function parseMarkdownTable(md: string): TableData {
  const lines = md.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [['', ''], ['', '']];

  const rows: TableData = [];
  for (const line of lines) {
    const trimmed = line.trim().replace(/^\||\|$/g, '');
    if (/^[\s\-:|]+$/.test(trimmed)) continue;
    const cells = trimmed.split('|').map((c) => c.trim());
    rows.push(cells);
  }

  if (rows.length === 0) return [['', ''], ['', '']];

  const maxCols = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => {
    while (r.length < maxCols) r.push('');
    return r;
  });
}

function toMarkdownTable(table: TableData): string {
  if (table.length === 0) return '';
  const colCount = table[0].length;

  const colWidths = Array.from({ length: colCount }, (_, c) =>
    Math.max(3, ...table.map((row) => (row[c] || '').length))
  );

  const pad = (text: string, width: number) => text.padEnd(width, ' ');
  const headerRow = '| ' + table[0].map((cell, i) => pad(cell, colWidths[i])).join(' | ') + ' |';
  const sepRow = '| ' + colWidths.map((w) => '-'.repeat(w)).join(' | ') + ' |';
  const bodyRows = table.slice(1).map(
    (row) => '| ' + row.map((cell, i) => pad(cell, colWidths[i])).join(' | ') + ' |'
  );

  return [headerRow, sepRow, ...bodyRows].join('\n');
}

function defaultWidths(count: number): number[] {
  const w = Math.floor(100 / count);
  const widths = Array(count).fill(w);
  widths[count - 1] = 100 - w * (count - 1);
  return widths;
}

export const TableEditorGui: React.FC<TableEditorGuiProps> = ({
  data,
  onChange,
  colWidths: externalWidths,
  onColWidthsChange,
}) => {
  const [table, setTable] = useState<TableData>(() => parseMarkdownTable(data));
  const [editingCell, setEditingCell] = useState<[number, number] | null>(null);
  const [colWidths, setColWidths] = useState<number[]>(() =>
    externalWidths ?? defaultWidths(parseMarkdownTable(data)[0]?.length || 2)
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const dragRef = useRef<{ colIndex: number; startX: number; startWidths: number[] } | null>(null);

  useEffect(() => {
    const parsed = parseMarkdownTable(data);
    setTable(parsed);
    if (!externalWidths || externalWidths.length !== parsed[0]?.length) {
      setColWidths(defaultWidths(parsed[0]?.length || 2));
    }
  }, [data]);

  useEffect(() => {
    if (externalWidths && externalWidths.length > 0) {
      setColWidths(externalWidths);
    }
  }, [externalWidths]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const commitWidths = useCallback((newWidths: number[]) => {
    setColWidths(newWidths);
    onColWidthsChange?.(newWidths);
  }, [onColWidthsChange]);

  const commit = useCallback((newTable: TableData) => {
    setTable(newTable);
    onChange(toMarkdownTable(newTable));
  }, [onChange]);

  const updateCell = useCallback((row: number, col: number, value: string) => {
    const newTable = table.map((r) => [...r]);
    newTable[row][col] = value;
    commit(newTable);
  }, [table, commit]);

  const addRow = useCallback(() => {
    const cols = table[0]?.length || 2;
    commit([...table, Array(cols).fill('')]);
  }, [table, commit]);

  const addColumn = useCallback(() => {
    const newTable = table.map((row, i) => [...row, i === 0 ? 'New' : '']);
    commit(newTable);
    const newCount = (table[0]?.length || 1) + 1;
    const even = defaultWidths(newCount);
    commitWidths(even);
  }, [table, commit, commitWidths]);

  const deleteRow = useCallback((rowIdx: number) => {
    if (table.length <= 1) return;
    commit(table.filter((_, i) => i !== rowIdx));
  }, [table, commit]);

  const deleteColumn = useCallback((colIdx: number) => {
    if (table[0].length <= 1) return;
    commit(table.map((row) => row.filter((_, i) => i !== colIdx)));
    const newWidths = colWidths.filter((_, i) => i !== colIdx);
    const total = newWidths.reduce((a, b) => a + b, 0);
    commitWidths(newWidths.map((w) => Math.round((w / total) * 100)));
  }, [table, commit, colWidths, commitWidths]);

  // --- Column resize drag ---
  const onResizeStart = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { colIndex, startX: e.clientX, startWidths: [...colWidths] };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current || !tableRef.current) return;
      const tableWidth = tableRef.current.getBoundingClientRect().width - 36;
      const deltaX = ev.clientX - dragRef.current.startX;
      const deltaPct = (deltaX / tableWidth) * 100;

      const { colIndex: ci, startWidths: sw } = dragRef.current;
      const newWidths = [...sw];
      const minW = 8;
      newWidths[ci] = Math.max(minW, sw[ci] + deltaPct);
      newWidths[ci + 1] = Math.max(minW, sw[ci + 1] - deltaPct);
      setColWidths(newWidths);
    };

    const onUp = () => {
      if (dragRef.current) {
        onColWidthsChange?.(colWidths);
        dragRef.current = null;
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [colWidths, onColWidthsChange]);

  const colCount = table[0]?.length || 0;

  return (
    <div className="table-editor-gui">
      <div className="table-grid-wrapper">
        <table className="table-grid" ref={tableRef}>
          <colgroup>
            <col style={{ width: 36 }} />
            {colWidths.map((w, i) => (
              <col key={i} style={{ width: `${w}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="table-corner" />
              {Array.from({ length: colCount }, (_, c) => (
                <th key={c} className="table-col-header">
                  <span className="col-label">Col {c + 1}</span>
                  <span className="col-width-label">{Math.round(colWidths[c] ?? 0)}%</span>
                  <button
                    className="table-del-btn"
                    onClick={() => deleteColumn(c)}
                    disabled={colCount <= 1}
                    title="Delete Column"
                  >
                    ×
                  </button>
                  {c < colCount - 1 && (
                    <div
                      className="col-resize-handle"
                      onMouseDown={(e) => onResizeStart(e, c)}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((row, r) => (
              <tr key={r} className={r === 0 ? 'header-row' : ''}>
                <td className="table-row-header">
                  <span className="row-label">{r === 0 ? 'H' : r}</span>
                  <button
                    className="table-del-btn"
                    onClick={() => deleteRow(r)}
                    disabled={table.length <= 1}
                    title="Delete Row"
                  >
                    ×
                  </button>
                </td>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className={`table-cell ${editingCell?.[0] === r && editingCell?.[1] === c ? 'editing' : ''} ${r === 0 ? 'is-header' : ''}`}
                    onDoubleClick={() => setEditingCell([r, c])}
                    onClick={() => {
                      if (!editingCell) setEditingCell([r, c]);
                    }}
                  >
                    {editingCell?.[0] === r && editingCell?.[1] === c ? (
                      <input
                        ref={inputRef}
                        className="table-cell-input"
                        value={cell}
                        onChange={(e) => updateCell(r, c, e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') {
                            setEditingCell(null);
                          } else if (e.key === 'Tab') {
                            e.preventDefault();
                            const nextCol = e.shiftKey ? c - 1 : c + 1;
                            if (nextCol >= 0 && nextCol < colCount) {
                              setEditingCell([r, nextCol]);
                            } else if (!e.shiftKey && r + 1 < table.length) {
                              setEditingCell([r + 1, 0]);
                            }
                          }
                        }}
                      />
                    ) : (
                      <span className="table-cell-text">{cell || '\u00A0'}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-actions">
        <button className="toolbar-btn small" onClick={addRow}>+ Row</button>
        <button className="toolbar-btn small" onClick={addColumn}>+ Column</button>
        <button
          className="toolbar-btn small"
          onClick={() => commitWidths(defaultWidths(colCount))}
          title="Reset column widths to equal"
        >
          Reset Widths
        </button>
      </div>
    </div>
  );
};
