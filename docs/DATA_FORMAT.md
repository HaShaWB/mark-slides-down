# Data Format

Mark Slide Down의 슬라이드 데이터 포맷 상세 명세입니다.

## 파일 확장자

| 확장자 | 설명 |
|--------|------|
| `.mslides` | 권장 전용 확장자 |
| `.slides.json` | JSON임을 명시하고 싶을 때 |

두 확장자 모두 동일한 JSON 구조를 사용합니다.

---

## 최상위 구조

```json
{
  "metadata": { ... },
  "slides": [ ... ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `metadata` | `SlideMetadata` | 프레젠테이션 전역 설정 |
| `slides` | `Slide[]` | 슬라이드 배열 |

---

## Metadata

```json
{
  "title": "프레젠테이션 제목",
  "author": "저자",
  "date": "2026-04-07",
  "theme": "default",
  "width": 1920,
  "height": 1080,
  "style": { ... }
}
```

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `title` | string | `"Untitled Presentation"` | 프레젠테이션 제목 |
| `author` | string | `""` | 저자 |
| `date` | string | 오늘 날짜 | 작성일 |
| `theme` | string | `"default"` | 테마 이름 |
| `width` | number | `1920` | 기준 해상도 너비 (px) |
| `height` | number | `1080` | 기준 해상도 높이 (px) |
| `style` | `SlideStyle` | (아래 참조) | 전역 스타일 설정 (선택) |

### 해상도 프리셋

| 프리셋 | 너비 | 높이 |
|--------|------|------|
| FHD (16:9) | 1920 | 1080 |
| HD (16:9) | 1280 | 720 |
| QHD (16:9) | 2560 | 1440 |
| 4K (16:9) | 3840 | 2160 |
| 4:3 표준 | 1024 | 768 |
| 4:3 고해상도 | 1600 | 1200 |

---

## SlideStyle

`metadata.style`에 포함되는 전역 스타일 설정입니다. 모든 필드는 선택이며, 지정하지 않으면 기본값이 사용됩니다.

```json
{
  "fontFamily": "'Segoe UI', 'Noto Sans KR', sans-serif",
  "codeFontFamily": "'Consolas', 'D2Coding', monospace",
  "color": "#1e1e1e",
  "backgroundColor": "#ffffff",
  "h1Size": 48,
  "h2Size": 36,
  "h3Size": 28,
  "h4Size": 24,
  "codeFontSize": 22,
  "lineHeight": 1.7,
  "cover": { ... },
  "body": { ... }
}
```

### Typography

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `fontFamily` | string | `"'Segoe UI', 'Noto Sans KR', sans-serif"` | 본문 폰트 |
| `codeFontFamily` | string | `"'Consolas', 'D2Coding', monospace"` | 코드 폰트 |
| `h1Size` | number | `48` | H1 크기 (px) |
| `h2Size` | number | `36` | H2 크기 (px) |
| `h3Size` | number | `28` | H3 크기 (px) |
| `h4Size` | number | `24` | H4 크기 (px) |
| `codeFontSize` | number | `22` | 코드 폰트 크기 (px) |
| `lineHeight` | number | `1.7` | 줄 간격 (배수) |

### Colors

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `color` | string | `"#1e1e1e"` | 텍스트 색상 |
| `backgroundColor` | string | `"#ffffff"` | 배경 색상 |

### LayoutStyle (Cover / Body)

`cover`와 `body` 각각에 독립적인 레이아웃 설정이 가능합니다.

```json
{
  "titleSize": 72,
  "contentSize": 32,
  "align": "center",
  "verticalAlign": "center",
  "paddingTop": 100,
  "paddingRight": 140,
  "paddingBottom": 100,
  "paddingLeft": 140
}
```

| 필드 | 타입 | Cover 기본값 | Body 기본값 | 설명 |
|------|------|-------------|-------------|------|
| `titleSize` | number | `72` | `48` | 제목 크기 (px) |
| `contentSize` | number | `32` | `28` | 내용 크기 (px) |
| `align` | string | `"center"` | `"left"` | 수평 정렬: `left`, `center`, `right` |
| `verticalAlign` | string | `"center"` | `"top"` | 수직 정렬: `top`, `center`, `bottom` |
| `paddingTop` | number | `100` | `80` | 상단 여백 (px) |
| `paddingRight` | number | `140` | `100` | 우측 여백 (px) |
| `paddingBottom` | number | `100` | `80` | 하단 여백 (px) |
| `paddingLeft` | number | `140` | `100` | 좌측 여백 (px) |

---

## Slide

```json
{
  "type": "body",
  "title": "슬라이드 제목",
  "content": "Markdown 본문 내용",
  "elements": [ ... ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | `"cover"` \| `"body"` | 슬라이드 타입 |
| `title` | string | 슬라이드 제목 (Markdown 지원) |
| `content` | string | 본문 내용 (Markdown 지원) |
| `elements` | `SlideElement[]` | 슬라이드 위에 배치된 요소들 |

### title / content

`title`과 `content`는 슬라이드의 기본 영역에 표시되며, 레이아웃 스타일(padding, align 등)에 따라 배치됩니다. Markdown 문법을 사용할 수 있습니다.

---

## SlideElement

슬라이드 위에 절대 위치로 배치되는 요소입니다.

```json
{
  "type": "code",
  "pos": [100, 300],
  "scale": 1.0,
  "data": "console.log('Hello');",
  "meta": { "language": "typescript" }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | string | 요소 타입 (아래 참조) |
| `pos` | `[x, y]` | 슬라이드 내 절대 위치 (px, 좌상단 기준) |
| `scale` | number | 크기 배율 (기본 `1.0`, 범위 `0.1` ~ `5.0`) |
| `data` | string | 타입별 콘텐츠 |
| `meta` | object | 타입별 부가 정보 (선택) |

### Element 타입별 data / meta

| 타입 | `data` | `meta` |
|------|--------|--------|
| `text` | 순수 텍스트 | — |
| `markdown` | Markdown 텍스트 | — |
| `code` | 소스 코드 | `language`: 프로그래밍 언어 (`"typescript"`, `"python"` 등) |
| `image` | 이미지 URL | `alt`: 대체 텍스트 |
| `table` | Markdown 테이블 문법 | `colWidths`: 열 너비 비율 (쉼표 구분, 예: `"40,30,30"`) |
| `diagram` | Mermaid 문법 | — |

### Scale 동작

- `1.0`: 원본 크기 (기준 해상도 대비)
- `0.5`: 50% 축소
- `2.0`: 200% 확대
- 프리뷰에서는 캔버스 크기에 맞게 자동 비례 조절됩니다

---

## 전체 예시

```json
{
  "metadata": {
    "title": "TypeScript 입문",
    "author": "홍길동",
    "date": "2026-04-07",
    "theme": "default",
    "width": 1920,
    "height": 1080,
    "style": {
      "fontFamily": "'Segoe UI', 'Noto Sans KR', sans-serif",
      "codeFontFamily": "'Consolas', 'D2Coding', monospace",
      "color": "#1e1e1e",
      "backgroundColor": "#ffffff",
      "cover": {
        "titleSize": 72,
        "contentSize": 32,
        "align": "center",
        "verticalAlign": "center",
        "paddingTop": 100,
        "paddingRight": 140,
        "paddingBottom": 100,
        "paddingLeft": 140
      },
      "body": {
        "titleSize": 48,
        "contentSize": 28,
        "align": "left",
        "verticalAlign": "top",
        "paddingTop": 80,
        "paddingRight": 100,
        "paddingBottom": 80,
        "paddingLeft": 100
      },
      "h1Size": 48,
      "h2Size": 36,
      "h3Size": 28,
      "h4Size": 24,
      "codeFontSize": 22,
      "lineHeight": 1.7
    }
  },
  "slides": [
    {
      "type": "cover",
      "title": "TypeScript 입문",
      "content": "기본 문법부터 실전까지",
      "elements": []
    },
    {
      "type": "body",
      "title": "변수와 타입",
      "content": "TypeScript는 정적 타입 시스템을 제공합니다.",
      "elements": [
        {
          "type": "code",
          "pos": [96, 300],
          "scale": 1.0,
          "data": "let name: string = 'World';\nlet count: number = 42;\nlet active: boolean = true;",
          "meta": { "language": "typescript" }
        },
        {
          "type": "markdown",
          "pos": [700, 300],
          "scale": 0.5,
          "data": "**주요 기본 타입**\n\n- `string`\n- `number`\n- `boolean`\n- `any`"
        }
      ]
    },
    {
      "type": "body",
      "title": "아키텍처",
      "content": "",
      "elements": [
        {
          "type": "diagram",
          "pos": [96, 200],
          "scale": 0.8,
          "data": "graph LR\n  A[Source .ts] --> B[Compiler tsc]\n  B --> C[Output .js]\n  C --> D[Runtime]"
        }
      ]
    }
  ]
}
```
