/**
 * Tailwind v4 CSS-to-Class Converter
 * Converts CSS property-value pairs to Tailwind utility classes
 */

import {
  SPACING_SCALE,
  COLOR_PALETTE,
  BORDER_RADIUS_SCALE,
  FONT_SIZE_SCALE,
  BORDER_WIDTH_SCALE,
  FONT_WEIGHT_SCALE,
  LINE_HEIGHT_SCALE,
  OPACITY_SCALE,
} from './tailwind-config';

/**
 * Convert a CSS property-value pair to Tailwind utility class(es)
 * Returns null if property cannot be converted
 */
export function cssToTailwind(prop: string, value: string): string | null {
  // Normalize property name (remove spaces)
  const normalizedProp = prop.trim().toLowerCase();
  const normalizedValue = value.trim();

  // Handle spacing properties (padding, margin, gap)
  if (['padding', 'margin', 'gap'].includes(normalizedProp)) {
    return spacingClass(normalizedProp, normalizedValue);
  }

  // Handle individual padding/margin sides
  if (normalizedProp.match(/^(padding|margin)-(top|right|bottom|left)$/)) {
    const prefix = normalizedProp.startsWith('padding') ? 'p' : 'm';
    const side = normalizedProp.split('-')[1];
    const sideMap: Record<string, string> = {
      top: 't',
      right: 'r',
      bottom: 'b',
      left: 'l',
    };
    return `${prefix}${sideMap[side]}-${SPACING_SCALE[normalizedValue] || `[${normalizedValue}]`}`;
  }

  // Handle color properties
  if (['background-color', 'color', 'border-color'].includes(normalizedProp)) {
    return colorClass(normalizedProp, normalizedValue);
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

  // Handle justify-content
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

  // Handle opacity
  if (normalizedProp === 'opacity') {
    const num = parseFloat(normalizedValue);
    const percent = Math.round(num * 100);
    const opacityKey = percent.toString();
    return OPACITY_SCALE[opacityKey] ? `opacity-${OPACITY_SCALE[opacityKey]}` : null;
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
    return `${normalizedProp}-[${normalizedValue}]`;
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

  // Handle font-style
  if (normalizedProp === 'font-style') {
    return normalizedValue === 'italic' ? 'italic' : 'not-italic';
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

  // Handle letter-spacing
  if (normalizedProp === 'letter-spacing') {
    const map: Record<string, string> = {
      '-0.05em': 'tracking-tighter',
      '-0.025em': 'tracking-tight',
      '0em': 'tracking-normal',
      '0.025em': 'tracking-wide',
      '0.05em': 'tracking-wider',
      '0.1em': 'tracking-widest',
    };
    return map[normalizedValue] || null;
  }

  // Handle word-spacing
  if (normalizedProp === 'word-spacing') {
    return `word-spacing-[${normalizedValue}]`;
  }

  // Handle border-width
  if (normalizedProp === 'border-width' || normalizedProp === 'border') {
    return borderWidthClass(normalizedValue);
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
    return normalizedValue === '1' ? 'flex-grow' : `flex-grow-[${normalizedValue}]`;
  }

  // Handle flex-shrink
  if (normalizedProp === 'flex-shrink') {
    return normalizedValue === '1' ? 'flex-shrink' : `flex-shrink-[${normalizedValue}]`;
  }

  // Handle flex-basis
  if (normalizedProp === 'flex-basis') {
    return `flex-basis-[${normalizedValue}]`;
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

  // Property not supported
  return null;
}

/**
 * Convert spacing value to Tailwind class
 */
function spacingClass(prefix: string, value: string): string | null {
  const scale = SPACING_SCALE[value];
  if (scale) {
    return `${prefix}-${scale}`;
  }
  // Fallback to arbitrary value
  return `${prefix}-[${value}]`;
}

/**
 * Convert color value to Tailwind class
 */
function colorClass(prop: string, value: string): string | null {
  const colorPrefix =
    prop === 'background-color' ? 'bg' : prop === 'color' ? 'text' : 'border';
  const normalizedValue = value.toLowerCase();
  const colorName = COLOR_PALETTE[normalizedValue];

  if (colorName) {
    return `${colorPrefix}-${colorName}`;
  }

  // Fallback to arbitrary value
  return `${colorPrefix}-[${value}]`;
}

/**
 * Convert border-radius value to Tailwind class
 */
function borderRadiusClass(value: string): string | null {
  const scale = BORDER_RADIUS_SCALE[value];
  if (scale) {
    return `rounded-${scale}`;
  }
  return `rounded-[${value}]`;
}

/**
 * Convert border-width value to Tailwind class
 */

/**
 * Convert font-size value to Tailwind class
 */
function fontSizeClass(value: string): string | null {
  const scale = FONT_SIZE_SCALE[value];
  if (scale) {
    return `text-${scale}`;
  }
  return `text-[${value}]`;
}

/**
 * Convert font-weight value to Tailwind class
 */
function fontWeightClass(value: string): string | null {
  const scale = FONT_WEIGHT_SCALE[value];
  if (scale) {
    return `font-${scale}`;
  }
  return `font-[${value}]`;
}

/**
 * Convert line-height value to Tailwind class
 */
function lineHeightClass(value: string): string | null {
  const scale = LINE_HEIGHT_SCALE[value];
  if (scale) {
    return `leading-${scale}`;
  }
  return `leading-[${value}]`;
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
 * Convert border-width value to Tailwind class
 */
function borderWidthClass(value: string): string | null {
  const scale = BORDER_WIDTH_SCALE[value];
  if (scale) {
    return scale === 'DEFAULT' ? 'border' : `border-${scale}`;
  }
  return `border-[${value}]`;
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
