# Development Guide

Mark Slide Down 개발, 빌드, 배포 가이드입니다.

## 프로젝트 구조

```
mark-slide-down/
├── src/
│   ├── extension.ts          # VS Code extension 진입점
│   ├── slideEditorProvider.ts # Custom Editor Provider
│   ├── types.ts               # 타입 정의 및 기본값
│   ├── themes.ts              # 테마 프리셋 정의
│   ├── exporter.ts            # HTML/PDF export
│   ├── markdownImporter.ts    # .md → slides 변환
│   └── webview/
│       ├── index.tsx           # Webview 진입점
│       ├── App.tsx             # 메인 React 컴포넌트
│       ├── vscodeApi.ts        # VS Code Webview API 래퍼
│       ├── styles.css          # 전역 스타일
│       ├── utils/
│       │   └── markdown.ts     # Markdown 렌더링 (marked + highlight.js)
│       └── components/
│           ├── SlidePreview.tsx    # 슬라이드 미리보기
│           ├── SlideEditor.tsx     # 슬라이드 편집기
│           ├── ElementEditor.tsx   # Element 편집기
│           ├── MetadataEditor.tsx  # 메타데이터 편집
│           ├── StyleEditor.tsx     # 스타일 편집
│           ├── Toolbar.tsx         # 상단 툴바
│           ├── TableEditorGui.tsx  # GUI 테이블 에디터
│           └── MermaidDiagram.tsx  # Mermaid 다이어그램 렌더링
├── dist/                # 빌드 결과물
├── samples/             # 샘플 슬라이드 파일
├── docs/                # 문서
├── webpack.extension.js # Extension 번들 설정
├── webpack.webview.js   # Webview 번들 설정
├── package.json
└── tsconfig.json
```

## 빌드 아키텍처

Webpack으로 두 개의 독립 번들을 생성합니다:

| 번들 | 엔트리 | 타겟 | 출력 |
|-------|--------|------|------|
| Extension | `src/extension.ts` | Node.js | `dist/extension.js` |
| Webview | `src/webview/index.tsx` | Web | `dist/webview.js` |

Webview 번들은 `LimitChunkCountPlugin`으로 단일 파일로 합쳐집니다. VS Code webview에서는 코드 스플리팅된 chunk를 로드할 수 없기 때문입니다.

---

## 개발 환경 설정

### 필수 조건

- Node.js 18+
- VS Code 1.85+

### 설치 및 실행

```bash
npm install
```

#### 방법 1: F5 디버깅 (권장)

VS Code에서 `F5`를 누르면 Extension Development Host가 열립니다. `samples/` 폴더의 `.slides.json` 파일을 열어 테스트합니다.

#### 방법 2: watch 모드

```bash
npm run dev
```

Extension과 Webview를 동시에 watch 모드로 빌드합니다. 파일 변경 시 자동 재빌드됩니다.

#### 방법 3: 수동 빌드

```bash
npm run build                 # 전체 프로덕션 빌드
npm run build:extension       # Extension만
npm run build:webview          # Webview만
```

---

## 주요 의존성

| 패키지 | 용도 |
|--------|------|
| `react`, `react-dom` | Webview UI |
| `marked` | Markdown → HTML 변환 (GFM 지원) |
| `highlight.js` | 코드 구문 하이라이팅 |
| `mermaid` | 다이어그램 렌더링 (webview 번들에 포함) |
| `webpack` | 번들링 |
| `ts-loader` | TypeScript 컴파일 |
| `css-loader`, `style-loader` | CSS 처리 |

---

## VSIX 패키징

### 도구 설치

```bash
npm install -g @vscode/vsce
```

### 패키징 실행

```bash
vsce package --allow-missing-repository
```

`mark-slide-down-x.x.x.vsix` 파일이 프로젝트 루트에 생성됩니다.

`.vscodeignore` 파일이 `node_modules`, `src`, `samples` 등을 제외하여 번들 크기를 최소화합니다 (~1.5MB).d

### 버전 업데이트

```bash
# package.json의 version을 수동으로 올리거나:
npm version patch   # 0.0.1 → 0.0.2
npm version minor   # 0.0.2 → 0.1.0
npm version major   # 0.1.0 → 1.0.0

# 그 다음 패키징
vsce package --allow-missing-repository
```

---

## 배포

### GitHub Releases (권장)

1. 버전 올리고 패키징
2. GitHub에서 새 Release 생성
3. `.vsix` 파일을 Release에 첨부
4. 사용자는 다운로드 후 `Extensions: Install from VSIX...`로 설치

### VS Code Marketplace

전체 마켓플레이스 배포가 필요한 경우:

1. [Azure DevOps](https://dev.azure.com)에서 Personal Access Token 발급
2. `vsce login <publisher>` 으로 로그인
3. `vsce publish` 로 배포

---

## 코드 컨벤션

- TypeScript strict mode
- React 함수 컴포넌트 + Hooks
- Webview ↔ Extension 통신은 `postMessage` / `onDidReceiveMessage`
- 스타일은 CSS variables + container query units (`cqw`)로 반응형 처리
