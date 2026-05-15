# AGENTS.md

> LLM 에이전트(Claude Code, Codex 등)를 위한 단일 기준 문서.
> 이 저장소에서 작업하거나, `.mslides` / `.slides.json` 슬라이드 파일을 편집할 때 **먼저 이 문서를 읽으세요.**
> 사람용 상세 문서는 [README.md](README.md), [docs/DATA_FORMAT.md](docs/DATA_FORMAT.md), [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) 에 있으나, **충돌 시 이 문서와 [src/types.ts](src/types.ts) 가 우선**입니다.

---

## 이 저장소가 무엇인가

**Mark Slide Down** — Markdown 기반 슬라이드를 만드는 VS Code Extension. 슬라이드는 단일 JSON 파일(`.mslides` 또는 `.slides.json`, **구조 동일**)로 저장됩니다.

에이전트에게 들어오는 작업은 보통 두 종류입니다:

| 시나리오 | 무엇을 하나 | 핵심 섹션 |
|----------|-------------|-----------|
| **A. 슬라이드 파일 편집** | 사용자가 `.mslides`/`.slides.json` 파일을 주고 "슬라이드 추가/수정/재구성" 요청 | [슬라이드 파일 포맷](#슬라이드-파일-포맷) · [편집 규칙](#슬라이드-편집-규칙) |
| **B. 확장 프로그램 개발** | 이 TypeScript/React 코드베이스 자체를 수정 | [코드베이스 개발](#코드베이스-개발) |

> 시나리오 A에서 슬라이드 파일만 단독으로 드래그된 경우, 이 `AGENTS.md`가 함께 오지 않을 수 있습니다. 그럴 땐 아래 [슬라이드 파일 포맷](#슬라이드-파일-포맷) 섹션이 자기완결적 명세이므로 이 내용을 기준으로 작업하세요.

---

## 슬라이드 파일 포맷

### 최상위 구조

```json
{
  "metadata": { /* SlideMetadata */ },
  "slides":   [ /* Slide[] */ ]
}
```

JSON 외 다른 형식은 없습니다. 주석 불가(순수 JSON). 들여쓰기 2칸 권장.

### SlideMetadata

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `title` | string | `"Untitled Presentation"` | 프레젠테이션 제목 |
| `author` | string | `""` | 저자 |
| `date` | string | 오늘(YYYY-MM-DD) | 작성일 |
| `theme` | string | `"default"` | 테마 이름(표시용 메타) |
| `width` | number | `1920` | 기준 해상도 너비(px) |
| `height` | number | `1080` | 기준 해상도 높이(px) |
| `style` | `SlideStyle` | (생략 시 기본 스타일) | 전역 스타일. **선택적** |

해상도 프리셋: 1920×1080(FHD), 1280×720(HD), 2560×1440(QHD), 3840×2160(4K), 1024×768(4:3), 1600×1200(4:3).

### SlideStyle (`metadata.style`, 모두 선택)

```jsonc
{
  "fontFamily": "'Segoe UI', 'Noto Sans KR', sans-serif",
  "codeFontFamily": "'Consolas', 'D2Coding', monospace",
  "color": "#1e1e1e",
  "backgroundColor": "#ffffff",
  "h1Size": 48, "h2Size": 36, "h3Size": 28, "h4Size": 24,
  "codeFontSize": 22,
  "lineHeight": 1.7,
  "bodySeparatorShow": true,
  "bodySeparatorColor": "#007acc",
  "cover": { /* LayoutStyle */ },
  "body":  { /* LayoutStyle */ }
}
```

`bodySeparatorShow` / `bodySeparatorColor` 는 body 슬라이드 제목 아래 구분선입니다. (사람용 DATA_FORMAT.md엔 누락돼 있으나 [src/types.ts](src/types.ts) 기준 실제 존재.)

**LayoutStyle** (`cover` / `body` 각각 독립):

| 필드 | 타입 | Cover 기본 | Body 기본 | 비고 |
|------|------|-----------|-----------|------|
| `titleSize` | number | 72 | 48 | 제목 px |
| `contentSize` | number | 32 | 28 | 내용 px |
| `align` | `"left"\|"center"\|"right"` | `center` | `left` | 수평 |
| `verticalAlign` | `"top"\|"center"\|"bottom"` | `center` | `top` | 수직 |
| `paddingTop/Right/Bottom/Left` | number | 100/140/100/140 | 80/100/80/100 | px |

### Slide

```json
{ "type": "body", "title": "제목", "content": "Markdown 본문", "elements": [] }
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | `"cover"` \| `"body"` | `cover`=표지(중앙정렬 기본), `body`=본문(좌상단 기본) |
| `title` | string | 슬라이드 제목 (Markdown 가능) |
| `content` | string | 본문 (Markdown 가능). 빈 영역이면 `""` |
| `elements` | `SlideElement[]` | 절대 위치 요소들. 없으면 `[]` |

### SlideElement

```json
{ "type": "code", "pos": [100, 300], "scale": 1.0, "data": "...", "meta": { "language": "python" } }
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | ElementType | 아래 표 참조 |
| `pos` | `[x, y]` | **슬라이드 내 절대 픽셀 좌표, 좌상단(0,0) 기준.** `width`/`height` 범위 안에 둘 것 |
| `scale` | number | 크기 배율. 기본 `1.0`, 범위 `0.1`~`5.0` (0.5=50%, 2.0=200%) |
| `data` | string | 타입별 콘텐츠 |
| `meta` | `Record<string,string>` | 타입별 부가정보. 선택 |

**ElementType별 `data` / `meta`:**

| `type` | `data` | `meta` |
|--------|--------|--------|
| `text` | 순수 텍스트 | — |
| `markdown` | Markdown 텍스트 | — |
| `code` | 소스 코드 | `language`: `"typescript"`, `"python"` 등 |
| `image` | 이미지 URL | `alt`: 대체 텍스트 |
| `table` | Markdown 테이블 문법 | `colWidths`: 열 너비 비율, 쉼표 구분 (예 `"40,30,30"`) |
| `diagram` | Mermaid 문법 | — |
| `latex` | KaTeX/LaTeX 수식 (예 `e^{i\\pi}+1=0`) | — |

`latex`는 [src/types.ts](src/types.ts) 기준 유효한 타입입니다(사람용 문서엔 누락). JSON 문자열이므로 백슬래시는 `\\`로 이스케이프.

---

## 슬라이드 편집 규칙

에이전트가 슬라이드 파일을 편집할 때 **반드시** 지킬 것:

1. **순수 JSON 유지** — 주석/트레일링 콤마 금지. 편집 후 `JSON.parse` 가능해야 함.
2. **개행은 `\n`** — `content`/`data` 안의 줄바꿈은 JSON 문자열 이스케이프(`"\n"`). 실제 개행 문자를 넣지 말 것.
3. **백슬래시 이스케이프** — LaTeX/정규식 등은 `\\` (예: `"e^{i\\pi}"`).
4. **빈 줄 = 여백** — 일반 Markdown과 달리 **연속 빈 줄 개수만큼 추가 수직 여백**이 생깁니다. 빈 줄 2개 → 여백 1줄 추가, 3개 → 2줄 추가. 의도적 여백이 아니면 빈 줄을 함부로 늘리지 말 것.
5. **좌표 경계** — `pos`는 `metadata.width`×`height` 안에 둘 것. element가 겹치지 않게 배치(요소는 절대 위치라 자동 흐름 없음).
6. **스키마 밖 필드 금지** — 위 표에 없는 필드를 추가하면 에디터가 무시하거나 깨질 수 있음. `style`은 부분 지정 가능(미지정 필드는 기본값으로 머지됨).
7. **타입 보존** — `type`은 정의된 리터럴만. `scale`/사이즈는 number(문자열 아님).
8. **첫 슬라이드 관례** — 보통 `slides[0]`은 `type: "cover"`. 새 프레젠테이션 생성 시 cover 1장 + body 최소 1장.
9. **최소 변경(diff 최소화)** — 요청된 슬라이드/필드만 수정하고 무관한 포매팅·필드 순서를 건드리지 말 것. 사용자 작업물이므로 보존이 우선.
10. **검증** — 편집 후 전체 문서가 위 구조에 맞는지 self-check. 가능하면 `node -e "JSON.parse(require('fs').readFileSync(<file>,'utf8'))"` 로 파싱 확인.

최소 유효 문서 예:

```json
{
  "metadata": { "title": "제목", "author": "", "date": "2026-05-15", "theme": "default", "width": 1920, "height": 1080 },
  "slides": [
    { "type": "cover", "title": "표지 제목", "content": "부제", "elements": [] },
    { "type": "body",  "title": "슬라이드 1", "content": "- 항목 A\n- 항목 B", "elements": [] }
  ]
}
```

참고 샘플: [samples/demo.slides.json](samples/demo.slides.json) — 모든 element 타입의 실제 사용 예.

---

## 코드베이스 개발

이 저장소 자체를 수정하는 경우.

### 구조

| 경로 | 역할 |
|------|------|
| [src/extension.ts](src/extension.ts) | Extension 진입점, 커맨드 등록 |
| [src/slideEditorProvider.ts](src/slideEditorProvider.ts) | Custom Editor Provider (파일 ↔ webview) |
| [src/types.ts](src/types.ts) | **포맷의 단일 진실 공급원**. 타입/기본값/생성자 |
| [src/themes.ts](src/themes.ts) | 테마 프리셋 |
| [src/exporter.ts](src/exporter.ts) | HTML/PDF export |
| [src/markdownImporter.ts](src/markdownImporter.ts) | `.md` → slides 변환 |
| [src/webview/](src/webview/) | React UI (App, components/, utils/markdown.ts) |
| [webpack.extension.js](webpack.extension.js) / [webpack.webview.js](webpack.webview.js) | 분리 번들 설정 |

빌드는 2개 독립 번들: Extension(Node, `dist/extension.js`) + Webview(Web, `dist/webview.js`, 단일 파일 강제).

### 명령어

```bash
npm install
npm run dev          # extension+webview watch (개발)
npm run build        # 프로덕션 빌드 (vscode:prepublish가 호출)
npm run lint         # eslint src --ext ts,tsx
vsce package --allow-missing-repository   # VSIX 패키징
```

F5 → Extension Development Host에서 `samples/`의 파일을 열어 테스트.

### 컨벤션

- TypeScript strict, React 함수형 컴포넌트 + Hooks.
- Webview ↔ Extension 통신은 `postMessage` / `onDidReceiveMessage`.
- 스타일은 CSS 변수 + container query 단위(`cqw`)로 반응형.
- 커밋/배포는 사용자가 요청할 때만. 기본 브랜치(`main`) 직접 작업 전 브랜치 분리 고려.

### 포맷을 변경할 때 (중요)

데이터 포맷(타입/필드)을 바꾸면 **다음을 함께 갱신**하여 일관성을 유지:

1. [src/types.ts](src/types.ts) — 실제 타입/기본값 (진실 공급원)
2. 이 `AGENTS.md`의 [슬라이드 파일 포맷](#슬라이드-파일-포맷) 표
3. [docs/DATA_FORMAT.md](docs/DATA_FORMAT.md) — 사람용 명세
4. 필요 시 [samples/demo.slides.json](samples/demo.slides.json), 관련 webview 컴포넌트, exporter/importer

> 현재 DATA_FORMAT.md는 `latex` 타입과 `bodySeparatorShow/Color`가 누락된 상태입니다 — 포맷 문서 작업 시 같이 보정하세요.
