"use strict";
/**
 * Unit Tests for Tailwind v4 CSS-to-Class Converter
 * Tests all conversion functions with comprehensive coverage
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tailwind_converter_1 = require("./tailwind-converter");
// Test helper
function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
    }
    catch (error) {
        console.error(`✗ ${name}`);
        console.error(`  ${error}`);
        process.exit(1);
    }
}
function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toEqual(expected) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
            }
        },
        toContain(expected) {
            if (!actual.includes(expected)) {
                throw new Error(`Expected to contain ${expected}, got ${actual}`);
            }
        },
    };
}
// ============================================================================
// ENHANCEMENT 1: RGB/HSL Color Support Tests
// ============================================================================
test('converts RGB color to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('background-color', 'rgb(59, 130, 246)');
    expect(result).toBe('bg-blue-500');
});
test('converts RGBA color to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('background-color', 'rgba(59, 130, 246, 1)');
    expect(result).toBe('bg-blue-500');
});
test('converts HSL color to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('color', 'hsl(0, 100%, 50%)');
    expect(result).toBe('text-red-500');
});
test('converts HSLA color to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('border-color', 'hsla(0, 100%, 50%, 1)');
    expect(result).toBe('border-red-500');
});
test('fuzzy matches near RGB colors', () => {
    // rgb(60, 131, 245) is very close to blue-500 (59, 130, 246)
    const result = (0, tailwind_converter_1.cssToTailwind)('background-color', 'rgb(60, 131, 245)');
    expect(result).toBe('bg-blue-500');
});
test('fuzzy matches near HSL colors', () => {
    // hsl(0, 100%, 49%) is very close to red-500
    const result = (0, tailwind_converter_1.cssToTailwind)('color', 'hsl(0, 100%, 49%)');
    expect(result).toBe('text-red-500');
});
test('falls back to arbitrary value for unmatchable RGB', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('background-color', 'rgb(255, 255, 255)');
    expect(result).toContain('bg-[');
});
test('handles RGB with spaces', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('background-color', 'rgb( 59 , 130 , 246 )');
    expect(result).toBe('bg-blue-500');
});
test('handles HSL with spaces', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('color', 'hsl( 0 , 100% , 50% )');
    expect(result).toBe('text-red-500');
});
// ============================================================================
// ENHANCEMENT 2: Percentage Opacity Tests
// ============================================================================
test('converts percentage opacity to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('opacity', '50%');
    expect(result).toBe('opacity-50');
});
test('converts 0% opacity', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('opacity', '0%');
    expect(result).toBe('opacity-0');
});
test('converts 100% opacity', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('opacity', '100%');
    expect(result).toBe('opacity-100');
});
test('converts 75% opacity', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('opacity', '75%');
    expect(result).toBe('opacity-75');
});
test('still supports decimal opacity format', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('opacity', '0.5');
    expect(result).toBe('opacity-50');
});
test('converts decimal 0.75 opacity', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('opacity', '0.75');
    expect(result).toBe('opacity-75');
});
test('converts decimal 0 opacity', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('opacity', '0');
    expect(result).toBe('opacity-0');
});
test('converts decimal 1 opacity', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('opacity', '1');
    expect(result).toBe('opacity-100');
});
// ============================================================================
// ENHANCEMENT 3: Negative Value Handling Tests
// ============================================================================
test('converts negative margin to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('margin', '-8px');
    expect(result).toBe('-m-2');
});
test('converts negative margin-top', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('margin-top', '-16px');
    expect(result).toBe('-mt-4');
});
test('converts negative margin-right', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('margin-right', '-8px');
    expect(result).toBe('-mr-2');
});
test('converts negative margin-bottom', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('margin-bottom', '-4px');
    expect(result).toBe('-mb-1');
});
test('converts negative margin-left', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('margin-left', '-12px');
    expect(result).toBe('-ml-3');
});
test('converts negative padding', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('padding', '-4px');
    expect(result).toBe('-p-1');
});
test('converts negative padding-top', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('padding-top', '-8px');
    expect(result).toBe('-pt-2');
});
test('converts negative width', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('width', '-100px');
    expect(result).toBe('-w-[100px]');
});
test('converts negative height', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('height', '-50px');
    expect(result).toBe('-h-[50px]');
});
test('converts negative gap', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('gap', '-8px');
    expect(result).toBe('-2');
});
test('still supports positive margin', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('margin', '8px');
    expect(result).toBe('m-2');
});
test('still supports positive padding', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('padding', '16px');
    expect(result).toBe('p-4');
});
// ============================================================================
// Existing Functionality Tests (Backward Compatibility)
// ============================================================================
test('converts hex color to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('background-color', '#3b82f6');
    expect(result).toBe('bg-blue-500');
});
test('converts spacing to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('padding', '16px');
    expect(result).toBe('p-4');
});
test('converts font-size to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('font-size', '16px');
    expect(result).toBe('text-base');
});
test('converts font-weight to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('font-weight', '700');
    expect(result).toBe('font-bold');
});
test('converts border-radius to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('border-radius', '8px');
    expect(result).toBe('rounded-lg');
});
test('converts display to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('display', 'flex');
    expect(result).toBe('flex');
});
test('converts flex-direction to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('flex-direction', 'column');
    expect(result).toBe('flex-col');
});
test('converts align-items to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('align-items', 'center');
    expect(result).toBe('items-center');
});
test('converts justify-content to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('justify-content', 'center');
    expect(result).toBe('justify-center');
});
test('converts width to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('width', '100%');
    expect(result).toBe('w-full');
});
test('converts height to Tailwind class', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('height', 'auto');
    expect(result).toBe('h-auto');
});
test('returns null for unsupported property', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)');
    expect(result).toBe(null);
});
// ============================================================================
// Helper Function Tests
// ============================================================================
test('cssToTailwindClasses converts multiple properties', () => {
    const result = (0, tailwind_converter_1.cssToTailwindClasses)({
        padding: '16px',
        margin: '8px',
        'background-color': '#3b82f6',
    });
    expect(result).toEqual(['p-4', 'm-2', 'bg-blue-500']);
});
test('parseCssString parses CSS declarations', () => {
    const result = (0, tailwind_converter_1.parseCssString)('padding: 16px; margin: 8px;');
    expect(result).toEqual({
        padding: '16px',
        margin: '8px',
    });
});
test('cssStringToTailwind converts CSS string to classes', () => {
    const result = (0, tailwind_converter_1.cssStringToTailwind)('padding: 16px; background-color: #3b82f6;');
    expect(result).toEqual(['p-4', 'bg-blue-500']);
});
// ============================================================================
// Edge Cases
// ============================================================================
test('handles case-insensitive property names', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('PADDING', '16px');
    expect(result).toBe('p-4');
});
test('handles case-insensitive color values', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('background-color', '#3B82F6');
    expect(result).toBe('bg-blue-500');
});
test('handles whitespace in values', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('padding', '  16px  ');
    expect(result).toBe('p-4');
});
test('handles arbitrary values for unmapped sizes', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('padding', '123px');
    expect(result).toBe('p-[123px]');
});
test('handles arbitrary values for unmapped colors', () => {
    const result = (0, tailwind_converter_1.cssToTailwind)('background-color', '#abcdef');
    expect(result).toContain('bg-[');
});
// ============================================================================
// Summary
// ============================================================================
console.log('\n✅ All tests passed!');
