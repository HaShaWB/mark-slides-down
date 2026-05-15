import React, { useId, cloneElement, isValidElement } from 'react';

// ────────────────────────────────────────────────────────────────
// 접근성 공용 프리미티브
//
// Field        : 레이블 ↔ 컨트롤을 htmlFor/id로 프로그래밍적 연결
//                (스크린리더가 입력 컨트롤의 이름을 읽을 수 있게 함)
// Disclosure   : 접기/펼치기 헤더를 키보드 조작 가능한 button +
//                aria-expanded / aria-controls 로 노출
// ────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  /** wrapper div className (기본 'editor-field') */
  className?: string;
  style?: React.CSSProperties;
  /** 컨트롤 아래 보조 설명 (aria-describedby로 연결) */
  hint?: string;
  /** 정확히 하나의 폼 컨트롤(input/select/textarea 등) */
  children: React.ReactElement;
}

/**
 * 시각적 레이블을 유지하면서 `htmlFor`/`id`로 컨트롤과 연결한다.
 * 자식 컨트롤이 자체적으로 `id`를 지정한 경우 그것을 우선 사용한다.
 */
export const Field: React.FC<FieldProps> = ({
  label,
  className = 'editor-field',
  style,
  hint,
  children,
}) => {
  const autoId = useId();
  const childProps = (isValidElement(children) ? children.props : {}) as Record<string, unknown>;
  const controlId = (childProps.id as string) || autoId;
  const hintId = hint ? `${controlId}-hint` : undefined;

  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        id: controlId,
        'aria-describedby':
          [childProps['aria-describedby'] as string | undefined, hintId]
            .filter(Boolean)
            .join(' ') || undefined,
      })
    : children;

  return (
    <div className={className} style={style}>
      <label htmlFor={controlId}>{label}</label>
      {control}
      {hint && (
        <div className="field-hint" id={hintId}>
          {hint}
        </div>
      )}
    </div>
  );
};

interface DisclosureProps {
  open: boolean;
  onToggle: () => void;
  /** 헤더 button className */
  className: string;
  /** 펼쳐지는 패널의 id (aria-controls 연결용) */
  panelId: string;
  /** 스크린리더용 접근 이름 (시각 라벨이 아이콘 등으로 모호할 때) */
  ariaLabel?: string;
  children: React.ReactNode;
}

/**
 * 접기/펼치기 토글 헤더. native <button> 이므로 Tab 포커스 +
 * Enter/Space 동작 + aria-expanded 상태가 스크린리더에 노출된다.
 */
export const Disclosure: React.FC<DisclosureProps> = ({
  open,
  onToggle,
  className,
  panelId,
  ariaLabel,
  children,
}) => (
  <button
    type="button"
    className={`disclosure-btn ${className}`}
    aria-expanded={open}
    aria-controls={panelId}
    aria-label={ariaLabel}
    onClick={onToggle}
  >
    {children}
  </button>
);
