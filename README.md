# Mark Slides Down

Markdown 기반 슬라이드 VS Code Extension — 프로그래밍 강의에 특화된 슬라이드 도구

## 프로젝트 개요

기존 슬라이드 도구(PowerPoint, Google Slides)는 프로그래밍 강의에 특화되지 않아 코드 하이라이팅, 단계별 코드 표시 등의 기능이 부족합니다. VS Code에서 직접 슬라이드를 작성하고 발표할 수 있는 전용 Extension을 제공합니다.

### 핵심 차별점

- **빠른 제작**: 마크다운으로 빠르게 슬라이드 제작
- **LLM 친화적**: JSON 기반의 단순한 구조로 LLM 통합 용이
- **프로그래밍 특화**: 코드 구문 하이라이팅, Mermaid 다이어그램, 테이블 지원
- **GUI 에디터**: Jupyter처럼 인터렉티브한 페이지 기반 편집
- **완전한 커스터마이징**: 폰트, 색상, 레이아웃, 테마 프리셋
- **내보내기**: HTML 슬라이드쇼 + PDF (Chrome/Edge 기반)

### 타겟 사용자

- 프로그래밍 강사 (대학, 부트캠프, 온라인 강의)
- 기술 발표자 (컨퍼런스, 사내 세미나)
- 개발 튜토리얼 제작자

---

## 설치

### VSIX로 설치

1. [Releases](https://github.com/hashawb/mark-slide-down/releases) 에서 `.vsix` 파일 다운로드
2. VS Code에서 `Ctrl+Shift+P` → **Extensions: Install from VSIX...** 선택
3. 다운로드한 `.vsix` 파일 선택

또는 커맨드라인:

```bash
code --install-extension mark-slide-down-x.x.x.vsix
```

### 소스에서 빌드

```bash
git clone https://github.com/hashawb/mark-slide-down.git
cd mark-slide-down
npm install
npm run build
```

F5로 Extension Development Host를 실행하여 테스트할 수 있습니다. 자세한 내용은 [DEVELOPMENT.md](docs/DEVELOPMENT.md)를 참고하세요.

---

## 사용법

### 새 슬라이드 만들기

커맨드 팔레트(`Ctrl+Shift+P`)에서 **Mark Slide Down: New Slide File** 실행 후 저장 위치를 선택합니다.

지원 확장자:
- `.mslides` — 권장 (전용 확장자)
- `.slides.json` — JSON임을 명시하고 싶을 때

빈 파일을 만들어 열어도 자동으로 기본 슬라이드 구조가 채워집니다.

### 에디터 구성

파일을 열면 3분할 레이아웃이 표시됩니다. 각 패널 사이의 경계를 드래그하여 너비를 조절할 수 있습니다.

| 영역 | 설명 |
|------|------|
| **좌측 사이드바** | 슬라이드 썸네일 목록 + 기본 설정 (해상도 등) |
| **중앙 에디터** | 슬라이드 속성 편집, 스타일 설정, Element 관리 |
| **우측 프리뷰** | 실시간 슬라이드 미리보기 |

### Markdown Import

1. 툴바의 **Import .md** 버튼 클릭
2. 기존 `.md` 파일을 선택하면 자동으로 슬라이드로 변환

변환 규칙:
- `# H1` → Cover 슬라이드
- `## H2` → Body 슬라이드 제목
- `### H3` ~ 본문 → 슬라이드 콘텐츠
- `` ``` `` → Code element
- `![alt](url)` → Image element
- `---` → 페이지 구분

---

## 기능

### 슬라이드 타입

- **Cover**: 표지 페이지 — 제목/내용이 중앙 정렬 (설정으로 변경 가능)
- **Body**: 본문 페이지 — 제목/내용이 좌상단 배치 (설정으로 변경 가능)

### Element 타입

| 타입 | 설명 |
|------|------|
| `markdown` | GFM Markdown 렌더링 (테이블, 인용, 리스트 등) |
| `text` | 순수 텍스트 |
| `code` | 코드 블록 — 37개+ 언어 구문 하이라이팅 (highlight.js, GitHub Dark 테마) |
| `image` | 이미지 (URL 기반) |
| `table` | GUI 테이블 에디터 (셀 편집, 행/열 추가삭제, 열 너비 드래그 조절) |
| `diagram` | Mermaid 다이어그램 — 프리뷰 및 HTML export에서 렌더링 |

Element는 슬라이드 내에서 절대 위치(X, Y)로 배치되며, Scale 값(기본 1.0)으로 크기를 조절합니다.

### 코드 구문 하이라이팅

코드 블록(Code element 및 마크다운 내 fenced code block)에 **highlight.js** 기반 구문 하이라이팅이 자동 적용됩니다. 프리뷰와 HTML/PDF export에서 동일한 GitHub Dark 테마가 적용됩니다.

### Mermaid 다이어그램

Diagram element에 Mermaid 문법을 입력하면 프리뷰와 HTML export에서 렌더링됩니다.

```
graph TD
  A[시작] --> B{조건}
  B -->|Yes| C[결과1]
  B -->|No| D[결과2]
```

### 스타일 설정

에디터의 **Slide Style** 패널에서 프레젠테이션 전체 스타일을 설정합니다.

| 카테고리 | 설정 항목 |
|----------|-----------|
| **Typography** | 본문/코드 폰트, H1~H4 크기, 코드 폰트 크기, 줄 간격 |
| **Colors** | 텍스트 색상, 배경 색상 |
| **Cover Layout** | Title/Content 크기, 정렬(수평/수직), 패딩 |
| **Body Layout** | Title/Content 크기, 정렬(수평/수직), 패딩 |

### 테마 프리셋

**Theme Preset** 드롭다운에서 프리셋을 선택하면 전체 스타일이 일괄 적용됩니다:

| 테마 | 설명 |
|------|------|
| Default (Light) | 흰 배경, 진한 텍스트 |
| Dark | 어두운 배경, 밝은 텍스트 |
| Ocean | 깊은 남색 배경 |
| Solarized | 따뜻한 톤, 눈에 편한 색상 |
| Forest | 자연스러운 녹색 톤 |
| Minimal | 세리프 폰트, 넓은 여백 |
| Corporate | 비즈니스 프레젠테이션용 |

프리셋 적용 후 개별 값을 추가 수정할 수 있습니다.

### HTML Export

툴바의 **Export HTML** 버튼으로 독립 실행 가능한 HTML 파일을 생성합니다.

- **기본 모드**: 모든 슬라이드가 세로로 나열된 스크롤 문서
- **프레젠테이션 모드**: `F` 키로 전환, 전체화면 슬라이드쇼
  - 좌/우 화살표, Space, Enter로 내비게이션
  - `Esc`로 문서 모드 복귀
- 코드 하이라이팅, 스타일, Mermaid 다이어그램 모두 포함 (오프라인 동작)

### PDF Export

툴바의 **Export PDF** 버튼 또는 커맨드 팔레트의 **Mark Slide Down: Export to PDF**로 PDF를 생성합니다.

- Chrome 또는 Edge가 설치되어 있어야 합니다 (headless 모드 사용)
- 슬라이드 해상도에 맞춘 페이지 크기 자동 설정
- Chrome/Edge가 없는 경우: HTML export 후 브라우저에서 `Ctrl+P`로 인쇄

---

## 커맨드

| 커맨드 | 설명 |
|--------|------|
| `Mark Slide Down: New Slide File` | 새 슬라이드 파일 생성 (.mslides / .slides.json) |
| `Mark Slide Down: Import Markdown to Slides` | .md 파일을 슬라이드로 변환 |
| `Mark Slide Down: Export to PDF` | PDF 내보내기 |

---

## 데이터 포맷

파일 확장자: `.mslides` 또는 `.slides.json` (동일한 JSON 구조)

상세 스키마는 [DATA_FORMAT.md](docs/DATA_FORMAT.md)를 참고하세요.

간략 구조:

```json
{
  "metadata": {
    "title": "프레젠테이션 제목",
    "author": "저자",
    "width": 1920, "height": 1080,
    "style": { "fontFamily": "...", "color": "...", "backgroundColor": "...", ... }
  },
  "slides": [
    {
      "type": "cover",
      "title": "제목",
      "content": "부제목",
      "elements": []
    },
    {
      "type": "body",
      "title": "슬라이드 제목",
      "content": "- Markdown 내용",
      "elements": [
        {
          "type": "code",
          "pos": [100, 300],
          "scale": 1.0,
          "data": "console.log('Hello');",
          "meta": { "language": "typescript" }
        }
      ]
    }
  ]
}
```

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Extension | TypeScript, VS Code Custom Editor API |
| UI | React 18 |
| 번들러 | Webpack (extension + webview 분리 빌드) |
| Markdown | marked (GFM 지원) |
| 코드 하이라이팅 | highlight.js (GitHub Dark 테마) |
| 다이어그램 | Mermaid.js (번들 내장) |
| PDF | Chrome/Edge headless `--print-to-pdf` |

---

## 로드맵

- [ ] 드래그 앤 드롭 Element 배치
- [ ] Element 애니메이션 (순차 표시)
- [ ] VS Code Marketplace 배포

---

## 라이선스

MIT License — [LICENSE](LICENSE) 참조
