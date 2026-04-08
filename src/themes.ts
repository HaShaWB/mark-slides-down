import type { SlideStyle } from './types';
import { createDefaultStyle } from './types';

export interface ThemePreset {
  id: string;
  name: string;
  style: SlideStyle;
}

function makeTheme(
  id: string,
  name: string,
  overrides: Partial<SlideStyle> & {
    cover?: Partial<SlideStyle['cover']>;
    body?: Partial<SlideStyle['body']>;
  }
): ThemePreset {
  const base = createDefaultStyle();
  const { cover, body, ...rest } = overrides;
  return {
    id,
    name,
    style: {
      ...base,
      ...rest,
      cover: { ...base.cover, ...(cover || {}) },
      body: { ...base.body, ...(body || {}) },
    },
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  makeTheme('default', 'Default (Light)', {}),

  makeTheme('dark', 'Dark', {
    color: '#d4d4d4',
    backgroundColor: '#1e1e2e',
    bodySeparatorColor: '#569cd6',
  }),

  makeTheme('ocean', 'Ocean', {
    color: '#e8f4f8',
    backgroundColor: '#0a1628',
    fontFamily: "'Helvetica Neue', 'Noto Sans KR', sans-serif",
    bodySeparatorColor: '#2196f3',
  }),

  makeTheme('solarized', 'Solarized', {
    color: '#586e75',
    backgroundColor: '#fdf6e3',
    fontFamily: "'Georgia', 'Noto Serif KR', serif",
    bodySeparatorColor: '#b58900',
  }),

  makeTheme('forest', 'Forest', {
    color: '#e0e8d0',
    backgroundColor: '#1a2f1a',
    bodySeparatorColor: '#4caf50',
  }),

  makeTheme('minimal', 'Minimal', {
    color: '#333333',
    backgroundColor: '#fafafa',
    fontFamily: "'Georgia', 'Noto Serif KR', serif",
    lineHeight: 1.8,
    bodySeparatorShow: false,
    cover: {
      titleSize: 64,
      contentSize: 28,
      align: 'center',
      verticalAlign: 'center',
      paddingTop: 200,
      paddingRight: 220,
      paddingBottom: 200,
      paddingLeft: 220,
    },
    body: {
      titleSize: 44,
      contentSize: 26,
      align: 'left',
      verticalAlign: 'top',
      paddingTop: 120,
      paddingRight: 160,
      paddingBottom: 120,
      paddingLeft: 160,
    },
  }),

  makeTheme('corporate', 'Corporate', {
    color: '#2c3e50',
    backgroundColor: '#ffffff',
    fontFamily: "'Arial', 'Noto Sans KR', sans-serif",
    bodySeparatorColor: '#2c3e50',
    h1Size: 44,
    h2Size: 34,
    h3Size: 26,
    cover: {
      titleSize: 64,
      contentSize: 30,
      align: 'center',
      verticalAlign: 'center',
      paddingTop: 120,
      paddingRight: 160,
      paddingBottom: 120,
      paddingLeft: 160,
    },
  }),
];
