export type ElementType = 'text' | 'markdown' | 'code' | 'diagram' | 'image' | 'table' | 'latex';

export interface SlideDimensions {
  width: number;
  height: number;
}

export const DEFAULT_DIMENSIONS: SlideDimensions = { width: 1920, height: 1080 };

export const DIMENSION_PRESETS: { label: string; width: number; height: number }[] = [
  { label: '1920 × 1080 (16:9 FHD)', width: 1920, height: 1080 },
  { label: '1280 × 720 (16:9 HD)', width: 1280, height: 720 },
  { label: '2560 × 1440 (16:9 QHD)', width: 2560, height: 1440 },
  { label: '3840 × 2160 (16:9 4K)', width: 3840, height: 2160 },
  { label: '1024 × 768 (4:3)', width: 1024, height: 768 },
  { label: '1600 × 1200 (4:3)', width: 1600, height: 1200 },
];

export interface LayoutStyle {
  titleSize: number;
  contentSize: number;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'center' | 'bottom';
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

export interface SlideStyle {
  fontFamily: string;
  codeFontFamily: string;
  color: string;
  backgroundColor: string;

  cover: LayoutStyle;
  body: LayoutStyle;

  h1Size: number;
  h2Size: number;
  h3Size: number;
  h4Size: number;
  codeFontSize: number;
  lineHeight: number;

  bodySeparatorShow: boolean;
  bodySeparatorColor: string;
}

export function createDefaultStyle(): SlideStyle {
  return {
    fontFamily: "'Segoe UI', 'Noto Sans KR', sans-serif",
    codeFontFamily: "'Consolas', 'D2Coding', monospace",
    color: '#1e1e1e',
    backgroundColor: '#ffffff',

    cover: {
      titleSize: 72,
      contentSize: 32,
      align: 'center',
      verticalAlign: 'center',
      paddingTop: 100,
      paddingRight: 140,
      paddingBottom: 100,
      paddingLeft: 140,
    },
    body: {
      titleSize: 48,
      contentSize: 28,
      align: 'left',
      verticalAlign: 'top',
      paddingTop: 80,
      paddingRight: 100,
      paddingBottom: 80,
      paddingLeft: 100,
    },

    h1Size: 48,
    h2Size: 36,
    h3Size: 28,
    h4Size: 24,
    codeFontSize: 22,
    lineHeight: 1.7,

    bodySeparatorShow: true,
    bodySeparatorColor: '#007acc',
  };
}

export interface SlideElement {
  type: ElementType;
  pos: [number, number];
  scale: number;
  data: string;
  meta?: Record<string, string>;
}

export interface Slide {
  type: 'cover' | 'body';
  title: string;
  content: string;
  elements: SlideElement[];
}

export interface SlideMetadata {
  title: string;
  author: string;
  date: string;
  theme: string;
  width: number;
  height: number;
  style?: SlideStyle;
}

export interface SlidesDocument {
  metadata: SlideMetadata;
  slides: Slide[];
}

export function getDocDimensions(doc: SlidesDocument): SlideDimensions {
  return {
    width: doc.metadata.width || DEFAULT_DIMENSIONS.width,
    height: doc.metadata.height || DEFAULT_DIMENSIONS.height,
  };
}

export function getDocStyle(doc: SlidesDocument): SlideStyle {
  const def = createDefaultStyle();
  const s = doc.metadata.style;
  if (!s) return def;
  return {
    ...def,
    ...s,
    cover: { ...def.cover, ...s.cover },
    body: { ...def.body, ...s.body },
  };
}

export function createDefaultMetadata(): SlideMetadata {
  return {
    title: 'Untitled Presentation',
    author: '',
    date: new Date().toISOString().split('T')[0],
    theme: 'default',
    width: DEFAULT_DIMENSIONS.width,
    height: DEFAULT_DIMENSIONS.height,
    style: createDefaultStyle(),
  };
}

export function createDefaultSlide(type: 'cover' | 'body' = 'body'): Slide {
  return {
    type,
    title: type === 'cover' ? 'Presentation Title' : 'Slide Title',
    content: '',
    elements: [],
  };
}

export function createDefaultElement(type: ElementType = 'markdown', _dims?: SlideDimensions): SlideElement {
  const w = _dims?.width ?? DEFAULT_DIMENSIONS.width;
  const h = _dims?.height ?? DEFAULT_DIMENSIONS.height;

  const defaults: Record<ElementType, Partial<SlideElement>> = {
    text:     { data: '' },
    markdown: { data: '' },
    code:     { data: '', meta: { language: 'typescript' } },
    diagram:  { data: 'graph TD\n  A-->B' },
    image:    { data: '', meta: { alt: '' } },
    table:    { data: '| Header | Header |\n|--------|--------|\n| Cell   | Cell   |' },
    latex:    { data: 'e^{i\\pi} + 1 = 0' },
  };
  const d = defaults[type];
  return {
    type,
    pos: [Math.round(w * 0.05), Math.round(h * 0.5)],
    scale: 1.0,
    data: d.data ?? '',
    ...(d.meta ? { meta: d.meta } : {}),
  };
}

export function createDefaultDocument(): SlidesDocument {
  return {
    metadata: createDefaultMetadata(),
    slides: [
      createDefaultSlide('cover'),
      createDefaultSlide('body'),
    ],
  };
}
