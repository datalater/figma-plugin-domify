/**
 * Tailwind v4 CSS-to-Class Converter
 * Converts CSS property-value pairs to Tailwind utility classes
 * 
 * Enhanced with:
 * - RGB/HSL color support (converts to nearest Tailwind palette color)
 * - Percentage opacity format (e.g., opacity: 50% → opacity-50)
 * - Negative value handling (e.g., margin: -8px → -m-2)
 */

import {
  SPACING_SCALE,
  COLOR_PALETTE,


  BORDER_WIDTH_SCALE,
  FONT_WEIGHT_SCALE,
  LINE_HEIGHT_SCALE,
  OPACITY_SCALE,
} from './tailwind-config';

/**
 * Convert RGB color to hex format
 * Handles: rgb(255, 0, 0), rgba(255, 0, 0, 0.5)
 */
function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (!match) return null;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = match[4] ? parseFloat(match[4]) : 1;

  // Convert to hex
  const hex = `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  
  // If alpha is present and not 1, we'll handle it separately
  if (a < 1) {
    return hex; // Return hex, opacity will be handled separately
  }
  
  return hex;
}

/**
 * Convert HSL color to hex format
 * Handles: hsl(0, 100%, 50%), hsla(0, 100%, 50%, 0.5)
 */
function hslToHex(hsl: string): string | null {
  const match = hsl.match(/hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (!match) return null;

  const h = parseFloat(match[1]) / 360;
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Find nearest Tailwind color from palette
 * Uses simple Euclidean distance in RGB space
 */
function findNearestColor(hex: string): string | null {
  const targetRgb = hexToRgb(hex);
  if (!targetRgb) return null;

  let nearestColor: string | null = null;
  let minDistance = Infinity;

  for (const [paletteHex, colorName] of Object.entries(COLOR_PALETTE)) {
    const paletteRgb = hexToRgb(paletteHex);
    if (!paletteRgb) continue;

    const distance = Math.sqrt(
      Math.pow(targetRgb.r - paletteRgb.r, 2) +
      Math.pow(targetRgb.g - paletteRgb.g, 2) +
      Math.pow(targetRgb.b - paletteRgb.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestColor = colorName;
    }
  }

  return nearestColor;
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function normalizeVar(value: string): string {
  return value.replace(/var\(\s*([^,]+),\s*/g, 'var($1,');
}

function arb(prefix: string, value: string): string {
  return `${prefix}-[${value.replace(/\s+/g, '_')}]`;
}

export function cssToTailwind(prop: string, value: string): string | null {
  const normalizedProp = prop.trim().toLowerCase();
  const normalizedValue = normalizeVar(value.trim());

  if (normalizedProp === 'padding' || normalizedProp === 'margin') {
    return spacingShorthand(normalizedProp === 'padding' ? 'p' : 'm', normalizedValue);
  }

  if (normalizedProp === 'gap') {
    return spacingClass('gap', normalizedValue);
  }

  if (normalizedProp.match(/^(padding|margin)-(top|right|bottom|left)$/)) {
    const prefix = normalizedProp.startsWith('padding') ? 'p' : 'm';
    const sideMap: Record<string, string> = { top: 't', right: 'r', bottom: 'b', left: 'l' };
    const side = normalizedProp.split('-')[1];
    return singleSpacing(`${prefix}${sideMap[side]}`, normalizedValue);
  }

  // Handle color properties
  if (['background-color', 'color', 'border-color'].includes(normalizedProp)) {
    return colorClass(normalizedProp, normalizedValue);
  }

  if (normalizedProp === 'background') {
    return colorClass('background-color', normalizedValue);
  }

  if (normalizedProp === 'border') {
    return borderShorthand(normalizedValue);
  }

  if (normalizedProp.match(/^border-(top|right|bottom|left)$/)) {
    const side = normalizedProp.split('-')[1];
    const sideChar: Record<string, string> = { top: 't', right: 'r', bottom: 'b', left: 'l' };
    return borderSideShorthand(sideChar[side], normalizedValue);
  }

  if (normalizedProp === 'border-style') {
    const map: Record<string, string> = {
      solid: 'border-solid', dashed: 'border-dashed',
      dotted: 'border-dotted', double: 'border-double',
      none: 'border-none',
    };
    return map[normalizedValue] ?? null;
  }

  // Handle border-radius
  if (normalizedProp === 'border-radius') {
    return borderRadiusClass(normalizedValue);
  }

  // Handle border-width
  if (normalizedProp === "border-width") {
    return borderWidthClass(normalizedValue);
  }

  // Handle font-size
  if (normalizedProp === 'font-size') {
    return fontSizeClass(normalizedValue);
  }

  // Handle font-weight
  if (normalizedProp === 'font-weight') {
    return fontWeightClass(normalizedValue);
  }

  // Handle line-height
  if (normalizedProp === 'line-height') {
    return lineHeightClass(normalizedValue);
  }

  // Handle display
  if (normalizedProp === 'display') {
    return displayClass(normalizedValue);
  }

  // Handle flex-direction
  if (normalizedProp === 'flex-direction') {
    return normalizedValue === 'column' ? 'flex-col' : 'flex-row';
  }

  // Handle align-items
  if (normalizedProp === 'align-items') {
    const map: Record<string, string> = {
      center: 'items-center',
      'flex-start': 'items-start',
      'flex-end': 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    };
    return map[normalizedValue] || null;
  }

  if (normalizedProp === 'align-self') {
    const map: Record<string, string> = {
      stretch: 'self-stretch', center: 'self-center',
      'flex-start': 'self-start', 'flex-end': 'self-end',
      auto: 'self-auto', baseline: 'self-baseline',
    };
    return map[normalizedValue] ?? null;
  }

  if (normalizedProp === 'justify-content') {
    const map: Record<string, string> = {
      center: 'justify-center',
      'flex-start': 'justify-start',
      'flex-end': 'justify-end',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly',
    };
    return map[normalizedValue] || null;
  }

  // Handle width
  if (normalizedProp === 'width') {
    if (normalizedValue === '100%') return 'w-full';
    if (normalizedValue === 'auto') return 'w-auto';
    return spacingClass('w', normalizedValue);
  }

  // Handle height
  if (normalizedProp === 'height') {
    if (normalizedValue === '100%') return 'h-full';
    if (normalizedValue === 'auto') return 'h-auto';
    return spacingClass('h', normalizedValue);
  }

  // Handle min-width
  if (normalizedProp === 'min-width') {
    return spacingClass('min-w', normalizedValue);
  }

  // Handle max-width
  if (normalizedProp === 'max-width') {
    return spacingClass('max-w', normalizedValue);
  }

  // Handle min-height
  if (normalizedProp === 'min-height') {
    return spacingClass('min-h', normalizedValue);
  }

  // Handle max-height
  if (normalizedProp === 'max-height') {
    return spacingClass('max-h', normalizedValue);
  }

  // Handle opacity (now supports both decimal and percentage formats)
  if (normalizedProp === 'opacity') {
    return opacityClass(normalizedValue);
  }

  // Handle overflow
  if (normalizedProp === 'overflow') {
    const map: Record<string, string> = {
      hidden: 'overflow-hidden',
      visible: 'overflow-visible',
      auto: 'overflow-auto',
      scroll: 'overflow-scroll',
    };
    return map[normalizedValue] || null;
  }

  // Handle position
  if (normalizedProp === 'position') {
    const map: Record<string, string> = {
      absolute: 'absolute',
      relative: 'relative',
      fixed: 'fixed',
      sticky: 'sticky',
      static: 'static',
    };
    return map[normalizedValue] || null;
  }

  // Handle top, right, bottom, left
  if (['top', 'right', 'bottom', 'left'].includes(normalizedProp)) {
    if (normalizedValue === '0px' || normalizedValue === '0') return `${normalizedProp}-0`;
    if (normalizedValue === 'auto') return `${normalizedProp}-auto`;
    return arb(normalizedProp, normalizedValue);
  }

  // Handle text-align
  if (normalizedProp === 'text-align') {
    const map: Record<string, string> = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    };
    return map[normalizedValue] || null;
  }

  // Handle text-decoration
  if (normalizedProp === 'text-decoration') {
    const map: Record<string, string> = {
      none: 'no-underline',
      underline: 'underline',
      'line-through': 'line-through',
      overline: 'overline',
    };
    return map[normalizedValue] || null;
  }

  if (normalizedProp === 'font-style') {
    return normalizedValue === 'italic' ? 'italic' : null;
  }

  // Handle text-transform
  if (normalizedProp === 'text-transform') {
    const map: Record<string, string> = {
      uppercase: 'uppercase',
      lowercase: 'lowercase',
      capitalize: 'capitalize',
      none: 'normal-case',
    };
    return map[normalizedValue] || null;
  }

  if (normalizedProp === 'letter-spacing') {
    return arb('tracking', normalizedValue);
  }

  // Handle flex-wrap
  if (normalizedProp === 'flex-wrap') {
    const map: Record<string, string> = {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
      'wrap-reverse': 'flex-wrap-reverse',
    };
    return map[normalizedValue] || null;
  }

  // Handle flex-grow
  if (normalizedProp === 'flex-grow') {
    return normalizedValue === '1' ? 'flex-grow' : arb('flex-grow', normalizedValue);
  }

  // Handle flex-shrink
  if (normalizedProp === 'flex-shrink') {
    return normalizedValue === '1' ? 'flex-shrink' : arb('flex-shrink', normalizedValue);
  }

  // Handle flex-basis
  if (normalizedProp === 'flex-basis') {
    return arb('flex-basis', normalizedValue);
  }

  // Handle cursor
  if (normalizedProp === 'cursor') {
    const map: Record<string, string> = {
      pointer: 'cursor-pointer',
      default: 'cursor-default',
      text: 'cursor-text',
      move: 'cursor-move',
      'not-allowed': 'cursor-not-allowed',
      wait: 'cursor-wait',
      help: 'cursor-help',
    };
    return map[normalizedValue] || null;
  }

  // Handle user-select
  if (normalizedProp === 'user-select') {
    const map: Record<string, string> = {
      none: 'select-none',
      text: 'select-text',
      all: 'select-all',
      auto: 'select-auto',
    };
    return map[normalizedValue] || null;
  }

  // Handle white-space
  if (normalizedProp === 'white-space') {
    const map: Record<string, string> = {
      normal: 'whitespace-normal',
      nowrap: 'whitespace-nowrap',
      pre: 'whitespace-pre',
      'pre-wrap': 'whitespace-pre-wrap',
      'pre-line': 'whitespace-pre-line',
      'break-spaces': 'whitespace-break-spaces',
    };
    return map[normalizedValue] || null;
  }

  // Handle word-break
  if (normalizedProp === 'word-break') {
    const map: Record<string, string> = {
      normal: 'break-normal',
      'break-all': 'break-all',
      'break-word': 'break-words',
    };
    return map[normalizedValue] || null;
  }

  if (normalizedProp === 'box-shadow') {
    return arb('shadow', normalizedValue);
  }

  if (normalizedProp === 'aspect-ratio') {
    if (normalizedValue === '1 / 1' || normalizedValue === '1/1') return 'aspect-square';
    if (normalizedValue === '16 / 9' || normalizedValue === '16/9') return 'aspect-video';
    return `aspect-[${normalizedValue.replace(/\s+/g, '')}]`;
  }

  if (normalizedProp === 'overflow-x' || normalizedProp === 'overflow-y') {
    const axis = normalizedProp.split('-')[1];
    const map: Record<string, string> = {
      hidden: `overflow-${axis}-hidden`, visible: `overflow-${axis}-visible`,
      auto: `overflow-${axis}-auto`, scroll: `overflow-${axis}-scroll`,
    };
    return map[normalizedValue] ?? null;
  }

  return null;
}

/**
 * Convert spacing value to Tailwind class
 * Handles positive and negative values
 */
function spacingShorthand(prefix: string, value: string): string {
  const parts = value.split(/\s+/);

  if (parts.length === 1) {
    return singleSpacing(prefix, parts[0]);
  }

  if (parts.length === 2) {
    const y = singleSpacing(`${prefix}y`, parts[0]);
    const x = singleSpacing(`${prefix}x`, parts[1]);
    return `${y} ${x}`;
  }

  if (parts.length === 3) {
    const t = singleSpacing(`${prefix}t`, parts[0]);
    const x = singleSpacing(`${prefix}x`, parts[1]);
    const b = singleSpacing(`${prefix}b`, parts[2]);
    return `${t} ${x} ${b}`;
  }

  const t = singleSpacing(`${prefix}t`, parts[0]);
  const r = singleSpacing(`${prefix}r`, parts[1]);
  const b = singleSpacing(`${prefix}b`, parts[2]);
  const l = singleSpacing(`${prefix}l`, parts[3]);
  return `${t} ${r} ${b} ${l}`;
}

function singleSpacing(prefix: string, value: string): string {
  const isNegative = value.startsWith('-');
  const abs = isNegative ? value.substring(1) : value;
  const neg = isNegative ? '-' : '';
  const scale = SPACING_SCALE[abs];
  return scale ? `${neg}${prefix}-${scale}` : arb(`${neg}${prefix}`, abs);
}

function spacingClass(prefix: string, value: string): string | null {
  // Check for negative values
  const isNegative = value.startsWith('-');
  const absoluteValue = isNegative ? value.substring(1) : value;

  const scale = SPACING_SCALE[absoluteValue];
  if (scale) {
    const negativePrefix = isNegative ? '-' : '';
    
    // Map property names to Tailwind prefixes
    const prefixMap: Record<string, string> = {
      'padding': 'p',
      'margin': 'm',
      'gap': 'gap',
    };
    
    const tailwindPrefix = prefixMap[prefix] !== undefined ? prefixMap[prefix] : prefix;
    return `${negativePrefix}${tailwindPrefix}-${scale}`;
  }

  // Fallback to arbitrary value
  const tailwindPrefix = { 'padding': 'p', 'margin': 'm', 'gap': 'gap' }[prefix] || prefix;
  const negativePrefix = isNegative ? '-' : '';
  return arb(`${negativePrefix}${tailwindPrefix}`, absoluteValue);
}

/**
 * Convert color value to Tailwind class
 * Supports hex, rgb, rgba, hsl, hsla formats
 */
function colorClass(prop: string, value: string): string | null {
  const colorPrefix =
    prop === 'background-color' ? 'bg' : prop === 'color' ? 'text' : 'border';
  const normalizedValue = value.toLowerCase();

  // Try direct palette lookup first (hex colors)
  let colorName = COLOR_PALETTE[normalizedValue];
  if (colorName) {
    return `${colorPrefix}-${colorName}`;
  }

  // Try RGB conversion → exact palette match only
  let hex = rgbToHex(normalizedValue);
  if (hex) {
    colorName = COLOR_PALETTE[hex.toLowerCase()];
    if (colorName) {
      return `${colorPrefix}-${colorName}`;
    }
  }

  // Try HSL conversion → exact palette match only
  hex = hslToHex(normalizedValue);
  if (hex) {
    colorName = COLOR_PALETTE[hex.toLowerCase()];
    if (colorName) {
      return `${colorPrefix}-${colorName}`;
    }
  }

  return arb(colorPrefix, value);
}

/**
 * Convert opacity value to Tailwind class
 * Supports both decimal (0.5) and percentage (50%) formats
 */
function opacityClass(value: string): string | null {
  let percent: number;

  // Handle percentage format (e.g., "50%")
  if (value.endsWith('%')) {
    percent = parseInt(value.substring(0, value.length - 1), 10);
  } else {
    // Handle decimal format (e.g., "0.5")
    const num = parseFloat(value);
    percent = Math.round(num * 100);
  }

  const opacityKey = percent.toString();
  return OPACITY_SCALE[opacityKey] ? `opacity-${OPACITY_SCALE[opacityKey]}` : null;
}

/**
 * Convert border-radius value to Tailwind class
 */
function borderShorthand(value: string): string {
  const classes: string[] = [];
  const styles = ['solid', 'dashed', 'dotted', 'double', 'none'];
  const widthMatch = value.match(/^(\d+(?:\.\d+)?px)/);
  const styleMatch = styles.find((s) => value.includes(s));

  if (widthMatch) {
    const w = borderWidthClass(widthMatch[1]);
    if (w) classes.push(w);
  }

  if (styleMatch) {
    classes.push(`border-${styleMatch}`);
  }

  const colorPart = extractBorderColor(value, widthMatch?.[0], styleMatch);
  if (colorPart) {
    const mapped = colorClass('border-color', colorPart);
    if (mapped) classes.push(mapped);
  }

  return classes.length > 0 ? classes.join(' ') : arb('border', value);
}

function extractBorderColor(value: string, width?: string, style?: string): string | null {
  let remaining = value;
  if (width) remaining = remaining.replace(width, '');
  if (style) remaining = remaining.replace(style, '');
  const trimmed = remaining.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function borderSideShorthand(side: string, value: string): string {
  const classes: string[] = [];
  const styles = ['solid', 'dashed', 'dotted', 'double', 'none'];
  const widthMatch = value.match(/^(\d+(?:\.\d+)?px)/);
  const styleMatch = styles.find((s) => value.includes(s));

  if (widthMatch) {
    const w = BORDER_WIDTH_SCALE[widthMatch[1]];
    classes.push(w === 'DEFAULT' ? `border-${side}` : `border-${side}-[${widthMatch[1]}]`);
  }

  if (styleMatch) {
    classes.push(`border-${styleMatch}`);
  }

  const colorPart = extractBorderColor(value, widthMatch?.[0], styleMatch);
  if (colorPart) {
    const mapped = colorClass('border-color', colorPart);
    if (mapped) classes.push(mapped);
  }

  return classes.length > 0 ? classes.join(' ') : arb(`border-${side}`, value);
}

function borderRadiusClass(value: string): string | null {
  return arb('rounded', value);
}

/**
 * Convert border-width value to Tailwind class
 */
function borderWidthClass(value: string): string | null {
  const scale = BORDER_WIDTH_SCALE[value];
  if (scale) {
    return scale === 'DEFAULT' ? 'border' : `border-${scale}`;
  }
  return arb('border', value);
}

/**
 * Convert font-size value to Tailwind class
 */
function fontSizeClass(value: string): string | null {
  return arb('text', value);
}

/**
 * Convert font-weight value to Tailwind class
 */
function fontWeightClass(value: string): string | null {
  const scale = FONT_WEIGHT_SCALE[value];
  if (scale) {
    return `font-${scale}`;
  }
  return arb('font', value);
}

/**
 * Convert line-height value to Tailwind class
 */
function lineHeightClass(value: string): string | null {
  const scale = LINE_HEIGHT_SCALE[value];
  if (scale) {
    return `leading-${scale}`;
  }
  return arb('leading', value);
}

/**
 * Convert display value to Tailwind class
 */
function displayClass(value: string): string | null {
  const map: Record<string, string> = {
    flex: 'flex',
    grid: 'grid',
    block: 'block',
    inline: 'inline',
    'inline-block': 'inline-block',
    'inline-flex': 'inline-flex',
    'inline-grid': 'inline-grid',
    none: 'hidden',
    table: 'table',
    'table-row': 'table-row',
    'table-cell': 'table-cell',
  };
  return map[value] || null;
}

/**
 * Convert multiple CSS properties to Tailwind classes
 * Returns array of class names
 */
export function cssToTailwindClasses(cssProperties: Record<string, string>): string[] {
  const classes: string[] = [];

  for (const [prop, value] of Object.entries(cssProperties)) {
    const tailwindClass = cssToTailwind(prop, value);
    if (tailwindClass) {
      classes.push(tailwindClass);
    }
  }

  return classes;
}

/**
 * Parse CSS string into property-value pairs
 * Handles basic CSS declarations
 */
export function parseCssString(cssText: string): Record<string, string> {
  const properties: Record<string, string> = {};

  // Split by semicolon and process each declaration
  const declarations = cssText.split(';');

  for (const declaration of declarations) {
    const trimmed = declaration.trim();
    if (!trimmed) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const prop = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();

    if (prop && value) {
      properties[prop] = value;
    }
  }

  return properties;
}

/**
 * Convert CSS string to Tailwind classes
 * Handles parsing and conversion in one step
 */
export function cssStringToTailwind(cssText: string): string[] {
  const properties = parseCssString(cssText);
  return cssToTailwindClasses(properties);
}

type TextSegmentStyle = {
  fontSize: number;
  fontWeight: number;
  letterSpacingValue: number;
  letterSpacingUnit: 'PIXELS' | 'PERCENT';
  lineHeightValue: number | null;
  lineHeightUnit: 'PIXELS' | 'PERCENT' | 'AUTO';
  color: string | null;
  textDecoration: string;
  textCase: string;
  italic: boolean;
};

export function segmentToTailwind(style: TextSegmentStyle): string[] {
  const classes: string[] = [];

  classes.push(arb('text', `${style.fontSize}px`));

  const fw = FONT_WEIGHT_SCALE[String(style.fontWeight)];
  if (fw) classes.push(`font-${fw}`);
  else classes.push(arb('font', String(style.fontWeight)));

  if (style.color) {
    const colorName = COLOR_PALETTE[style.color.toLowerCase()];
    classes.push(colorName ? `text-${colorName}` : arb('text', style.color));
  }

  if (style.letterSpacingValue !== 0) {
    if (style.letterSpacingUnit === 'PERCENT') {
      const em = parseFloat((style.letterSpacingValue / 100).toFixed(4));
      classes.push(arb('tracking', `${em}em`));
    } else {
      classes.push(arb('tracking', `${style.letterSpacingValue}px`));
    }
  }

  if (style.lineHeightUnit === 'PIXELS' && style.lineHeightValue !== null) {
    classes.push(arb('leading', `${style.lineHeightValue}px`));
  } else if (style.lineHeightUnit === 'PERCENT' && style.lineHeightValue !== null) {
    classes.push(arb('leading', `${style.lineHeightValue}%`));
  }

  if (style.italic) classes.push('italic');

  const decoMap: Record<string, string> = {
    UNDERLINE: 'underline', STRIKETHROUGH: 'line-through',
  };
  if (decoMap[style.textDecoration]) classes.push(decoMap[style.textDecoration]);

  const caseMap: Record<string, string> = {
    UPPER: 'uppercase', LOWER: 'lowercase', TITLE: 'capitalize',
  };
  if (caseMap[style.textCase]) classes.push(caseMap[style.textCase]);

  return classes;
}
