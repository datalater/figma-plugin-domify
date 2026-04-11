/**
 * Tailwind v4 Configuration & Mapping Tables
 * Maps Figma CSS values to Tailwind utility classes
 */

// Spacing scale: px → Tailwind class suffix
// Based on Tailwind v4 default spacing scale (0.25rem = 4px base unit)
export const SPACING_SCALE: Record<string, string> = {
  '0px': '0',
  '1px': 'px',
  '2px': '0.5',
  '4px': '1',
  '6px': '1.5',
  '8px': '2',
  '10px': '2.5',
  '12px': '3',
  '14px': '3.5',
  '16px': '4',
  '20px': '5',
  '24px': '6',
  '28px': '7',
  '32px': '8',
  '36px': '9',
  '40px': '10',
  '44px': '11',
  '48px': '12',
  '56px': '14',
  '64px': '16',
  '80px': '20',
  '96px': '24',
  '112px': '28',
  '128px': '32',
  '144px': '36',
  '160px': '40',
  '176px': '44',
  '192px': '48',
  '208px': '52',
  '224px': '56',
  '240px': '60',
  '256px': '64',
  '288px': '72',
  '320px': '80',
  '384px': '96',
};

// Color palette: hex → Tailwind color name
// Tailwind v4 default colors (unique entries only)
export const COLOR_PALETTE: Record<string, string> = {
  // Slate
  '#f8fafc': 'slate-50',
  '#f1f5f9': 'slate-100',
  '#e2e8f0': 'slate-200',
  '#cbd5e1': 'slate-300',
  '#94a3b8': 'slate-400',
  '#64748b': 'slate-500',
  '#475569': 'slate-600',
  '#334155': 'slate-700',
  '#1e293b': 'slate-800',
  '#0f172a': 'slate-900',

  // Gray
  '#f9fafb': 'gray-50',
  '#f3f4f6': 'gray-100',
  '#e5e7eb': 'gray-200',
  '#d1d5db': 'gray-300',
  '#9ca3af': 'gray-400',
  '#6b7280': 'gray-500',
  '#4b5563': 'gray-600',
  '#374151': 'gray-700',
  '#1f2937': 'gray-800',
  '#111827': 'gray-900',

  // Zinc
  '#fafafa': 'zinc-50',
  '#f4f4f5': 'zinc-100',
  '#e4e4e7': 'zinc-200',
  '#d4d4d8': 'zinc-300',
  '#a1a1a6': 'zinc-400',
  '#71717a': 'zinc-500',
  '#52525b': 'zinc-600',
  '#3f3f46': 'zinc-700',
  '#27272a': 'zinc-800',
  '#18181b': 'zinc-900',

  // Neutral
  '#f5f5f5': 'neutral-100',
  '#d4d4d4': 'neutral-300',
  '#a3a3a3': 'neutral-400',
  '#737373': 'neutral-500',
  '#525252': 'neutral-600',
  '#404040': 'neutral-700',
  '#262626': 'neutral-800',
  '#171717': 'neutral-900',

  // Stone
  '#fafaf9': 'stone-50',
  '#f5f5f4': 'stone-100',
  '#e7e5e4': 'stone-200',
  '#d6d3d1': 'stone-300',
  '#a8a29e': 'stone-400',
  '#78716c': 'stone-500',
  '#57534e': 'stone-600',
  '#44403c': 'stone-700',
  '#292524': 'stone-800',
  '#1c1917': 'stone-900',

  // Red
  '#fef2f2': 'red-50',
  '#fee2e2': 'red-100',
  '#fecaca': 'red-200',
  '#fca5a5': 'red-300',
  '#f87171': 'red-400',
  '#ef4444': 'red-500',
  '#dc2626': 'red-600',
  '#b91c1c': 'red-700',
  '#7f1d1d': 'red-800',
  '#450a0a': 'red-900',

  // Orange
  '#fff7ed': 'orange-50',
  '#ffedd5': 'orange-100',
  '#fed7aa': 'orange-200',
  '#fdba74': 'orange-300',
  '#fb923c': 'orange-400',
  '#f97316': 'orange-500',
  '#ea580c': 'orange-600',
  '#c2410c': 'orange-700',
  '#7c2d12': 'orange-800',
  '#431407': 'orange-900',

  // Amber
  '#fffbeb': 'amber-50',
  '#fef3c7': 'amber-100',
  '#fde68a': 'amber-200',
  '#fcd34d': 'amber-300',
  '#fbbf24': 'amber-400',
  '#f59e0b': 'amber-500',
  '#d97706': 'amber-600',
  '#b45309': 'amber-700',
  '#78350f': 'amber-800',
  '#451a03': 'amber-900',

  // Yellow
  '#fefce8': 'yellow-50',
  '#fffacd': 'yellow-100',
  '#fff59d': 'yellow-200',
  '#fff176': 'yellow-300',
  '#ffee58': 'yellow-400',
  '#facc15': 'yellow-500',
  '#eab308': 'yellow-600',
  '#ca8a04': 'yellow-700',
  '#713f12': 'yellow-800',
  '#422006': 'yellow-900',

  // Lime
  '#f7fee7': 'lime-50',
  '#dcfce7': 'lime-200',
  '#86efac': 'lime-400',
  '#65a30d': 'lime-500',
  '#4ade80': 'lime-600',
  '#22c55e': 'lime-700',

  // Green
  '#f0fdf4': 'green-50',
  '#16a34a': 'green-600',
  '#14532d': 'green-900',

  // Emerald
  '#d1fae5': 'emerald-100',
  '#a7f3d0': 'emerald-200',
  '#6ee7b7': 'emerald-300',
  '#34d399': 'emerald-400',
  '#10b981': 'emerald-500',
  '#059669': 'emerald-600',
  '#047857': 'emerald-700',
  '#065f46': 'emerald-800',
  '#064e3b': 'emerald-900',

  // Teal
  '#f0fdfa': 'teal-50',
  '#ccfbf1': 'teal-100',
  '#99f6e4': 'teal-200',
  '#5eead4': 'teal-300',
  '#2dd4bf': 'teal-400',
  '#14b8a6': 'teal-500',
  '#0d9488': 'teal-600',
  '#0f766e': 'teal-700',
  '#134e4a': 'teal-800',
  '#0d3331': 'teal-900',

  // Cyan
  '#ecf0ff': 'cyan-50',
  '#cffafe': 'cyan-100',
  '#a5f3fc': 'cyan-200',
  '#67e8f9': 'cyan-300',
  '#06b6d4': 'cyan-400',
  '#0891b2': 'cyan-500',
  '#0e7490': 'cyan-600',
  '#155e75': 'cyan-700',
  '#164e63': 'cyan-800',
  '#082f49': 'cyan-900',

  // Sky
  '#f0f9ff': 'sky-50',
  '#e0f2fe': 'sky-100',
  '#bae6fd': 'sky-200',
  '#7dd3fc': 'sky-300',
  '#38bdf8': 'sky-400',
  '#0ea5e9': 'sky-500',
  '#0284c7': 'sky-600',
  '#0369a1': 'sky-700',
  '#075985': 'sky-800',
  '#0c3d5c': 'sky-900',

  // Blue
  '#eff6ff': 'blue-50',
  '#dbeafe': 'blue-100',
  '#bfdbfe': 'blue-200',
  '#93c5fd': 'blue-300',
  '#60a5fa': 'blue-400',
  '#3b82f6': 'blue-500',
  '#2563eb': 'blue-600',
  '#1d4ed8': 'blue-700',
  '#1e40af': 'blue-800',
  '#1e3a8a': 'blue-900',

  // Indigo
  '#eef2ff': 'indigo-50',
  '#e0e7ff': 'indigo-100',
  '#c7d2fe': 'indigo-200',
  '#a5b4fc': 'indigo-300',
  '#818cf8': 'indigo-400',
  '#6366f1': 'indigo-500',
  '#4f46e5': 'indigo-600',
  '#4338ca': 'indigo-700',
  '#3730a3': 'indigo-800',
  '#312e81': 'indigo-900',

  // Violet
  '#f5f3ff': 'violet-50',
  '#ede9fe': 'violet-100',
  '#ddd6fe': 'violet-200',
  '#c4b5fd': 'violet-300',
  '#a78bfa': 'violet-400',
  '#8b5cf6': 'violet-500',
  '#7c3aed': 'violet-600',
  '#6d28d9': 'violet-700',
  '#5b21b6': 'violet-800',

  // Purple
  '#faf5ff': 'purple-50',
  '#f3e8ff': 'purple-100',
  '#e9d5ff': 'purple-200',
  '#d8b4fe': 'purple-300',
  '#c084fc': 'purple-400',
  '#a855f7': 'purple-500',
  '#9333ea': 'purple-600',
  '#7e22ce': 'purple-700',
  '#6b21a8': 'purple-800',
  '#581c87': 'purple-900',

  // Fuchsia
  '#fdf4ff': 'fuchsia-50',
  '#fae8ff': 'fuchsia-100',
  '#f5d0fe': 'fuchsia-200',
  '#f0abfc': 'fuchsia-300',
  '#e879f9': 'fuchsia-400',
  '#d946ef': 'fuchsia-500',
  '#c026d3': 'fuchsia-600',
  '#a21caf': 'fuchsia-700',
  '#831843': 'fuchsia-800',

  // Pink
  '#fdf2f8': 'pink-50',
  '#fce7f3': 'pink-100',
  '#f472b6': 'pink-400',
  '#ec4899': 'pink-500',
  '#db2777': 'pink-600',
  '#9d174d': 'pink-800',

  // Rose
  '#fff5f7': 'rose-50',
  '#ffe4e6': 'rose-100',
  '#f43f5e': 'rose-500',
  '#e11d48': 'rose-600',
  '#9f1239': 'rose-800',
  '#4c0519': 'rose-900',

  // Grayscale
  '#000000': 'black',
  '#ffffff': 'white',
};

// Border radius scale: px → Tailwind class suffix
export const BORDER_RADIUS_SCALE: Record<string, string> = {
  '0px': 'none',
  '2px': 'sm',
  '4px': 'base',
  '6px': 'md',
  '8px': 'lg',
  '12px': 'xl',
  '16px': '2xl',
  '20px': '3xl',
  '24px': '4xl',
  '32px': 'full',
};

// Font size scale: px → Tailwind class suffix
export const FONT_SIZE_SCALE: Record<string, string> = {
  '12px': 'xs',
  '14px': 'sm',
  '16px': 'base',
  '18px': 'lg',
  '20px': 'xl',
  '24px': '2xl',
  '30px': '3xl',
  '36px': '4xl',
  '48px': '6xl',
  '60px': '7xl',
  '72px': '8xl',
  '96px': '9xl',
};

// Border width scale: px → Tailwind class suffix
export const BORDER_WIDTH_SCALE: Record<string, string> = {
  '1px': 'DEFAULT',
  '2px': '2',
  '4px': '4',
  '8px': '8',
};

// Font weight scale: numeric → Tailwind class suffix
export const FONT_WEIGHT_SCALE: Record<string, string> = {
  '100': 'thin',
  '200': 'extralight',
  '300': 'light',
  '400': 'normal',
  '500': 'medium',
  '600': 'semibold',
  '700': 'bold',
  '800': 'extrabold',
  '900': 'black',
};

// Line height scale: numeric → Tailwind class suffix
export const LINE_HEIGHT_SCALE: Record<string, string> = {
  '1': 'none',
  '1.25': 'tight',
  '1.375': 'snug',
  '1.5': 'normal',
  '1.625': 'relaxed',
  '2': 'loose',
};

// Opacity scale: percentage → Tailwind class suffix
export const OPACITY_SCALE: Record<string, string> = {
  '0': '0',
  '5': '5',
  '10': '10',
  '20': '20',
  '25': '25',
  '30': '30',
  '40': '40',
  '50': '50',
  '60': '60',
  '70': '70',
  '75': '75',
  '80': '80',
  '90': '90',
  '95': '95',
  '100': '100',
};
