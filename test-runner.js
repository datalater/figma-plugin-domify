"use strict";
/**
 * Simple Test Runner for Tailwind Converter
 * Validates all conversion functions without external dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tailwind_converter_1 = require("./tailwind-converter");
let passed = 0;
let failed = 0;
function test(name, fn) {
    try {
        if (fn()) {
            console.log(`✓ ${name}`);
            passed++;
        }
        else {
            console.log(`✗ ${name}`);
            failed++;
        }
    }
    catch (error) {
        console.log(`✗ ${name}: ${error}`);
        failed++;
    }
}
// RGB/HSL Color Support Tests
test('RGB color → bg-blue-500', () => (0, tailwind_converter_1.cssToTailwind)('background-color', 'rgb(59, 130, 246)') === 'bg-blue-500');
test('RGBA color → bg-blue-500', () => (0, tailwind_converter_1.cssToTailwind)('background-color', 'rgba(59, 130, 246, 1)') === 'bg-blue-500');
test('HSL color → text-red-500', () => (0, tailwind_converter_1.cssToTailwind)('color', 'hsl(0, 84%, 60%)') === 'text-red-500');
test('HSLA color → border-red-500', () => (0, tailwind_converter_1.cssToTailwind)('border-color', 'hsla(0, 84%, 60%, 1)') === 'border-red-500');
test('Fuzzy RGB match → bg-blue-500', () => (0, tailwind_converter_1.cssToTailwind)('background-color', 'rgb(60, 131, 245)') === 'bg-blue-500');
test('Fuzzy HSL match → text-red-500', () => (0, tailwind_converter_1.cssToTailwind)('color', 'hsl(0, 84%, 61%)') === 'text-red-500');
// Percentage Opacity Tests
test('50% opacity → opacity-50', () => (0, tailwind_converter_1.cssToTailwind)('opacity', '50%') === 'opacity-50');
test('0% opacity → opacity-0', () => (0, tailwind_converter_1.cssToTailwind)('opacity', '0%') === 'opacity-0');
test('100% opacity → opacity-100', () => (0, tailwind_converter_1.cssToTailwind)('opacity', '100%') === 'opacity-100');
test('75% opacity → opacity-75', () => (0, tailwind_converter_1.cssToTailwind)('opacity', '75%') === 'opacity-75');
test('0.5 decimal opacity → opacity-50', () => (0, tailwind_converter_1.cssToTailwind)('opacity', '0.5') === 'opacity-50');
test('0.75 decimal opacity → opacity-75', () => (0, tailwind_converter_1.cssToTailwind)('opacity', '0.75') === 'opacity-75');
// Negative Value Tests
test('Negative margin → -m-2', () => (0, tailwind_converter_1.cssToTailwind)('margin', '-8px') === '-m-2');
test('Negative margin-top → -mt-4', () => (0, tailwind_converter_1.cssToTailwind)('margin-top', '-16px') === '-mt-4');
test('Negative margin-right → -mr-2', () => (0, tailwind_converter_1.cssToTailwind)('margin-right', '-8px') === '-mr-2');
test('Negative margin-bottom → -mb-1', () => (0, tailwind_converter_1.cssToTailwind)('margin-bottom', '-4px') === '-mb-1');
test('Negative margin-left → -ml-3', () => (0, tailwind_converter_1.cssToTailwind)('margin-left', '-12px') === '-ml-3');
test('Negative padding → -p-1', () => (0, tailwind_converter_1.cssToTailwind)('padding', '-4px') === '-p-1');
test('Negative padding-top → -pt-2', () => (0, tailwind_converter_1.cssToTailwind)('padding-top', '-8px') === '-pt-2');
test('Negative width → -w-[100px]', () => (0, tailwind_converter_1.cssToTailwind)('width', '-100px') === '-w-[100px]');
test('Negative height → -h-[50px]', () => (0, tailwind_converter_1.cssToTailwind)('height', '-50px') === '-h-[50px]');
test('Negative gap → -2', () => (0, tailwind_converter_1.cssToTailwind)('gap', '-8px') === '-2');
// Backward Compatibility Tests
test('Hex color → bg-blue-500', () => (0, tailwind_converter_1.cssToTailwind)('background-color', '#3b82f6') === 'bg-blue-500');
test('Positive margin → m-2', () => (0, tailwind_converter_1.cssToTailwind)('margin', '8px') === 'm-2');
test('Positive padding → p-4', () => (0, tailwind_converter_1.cssToTailwind)('padding', '16px') === 'p-4');
test('Font-size → text-base', () => (0, tailwind_converter_1.cssToTailwind)('font-size', '16px') === 'text-base');
test('Font-weight → font-bold', () => (0, tailwind_converter_1.cssToTailwind)('font-weight', '700') === 'font-bold');
test('Border-radius → rounded-lg', () => (0, tailwind_converter_1.cssToTailwind)('border-radius', '8px') === 'rounded-lg');
test('Display flex → flex', () => (0, tailwind_converter_1.cssToTailwind)('display', 'flex') === 'flex');
test('Flex-direction column → flex-col', () => (0, tailwind_converter_1.cssToTailwind)('flex-direction', 'column') === 'flex-col');
test('Align-items center → items-center', () => (0, tailwind_converter_1.cssToTailwind)('align-items', 'center') === 'items-center');
test('Justify-content center → justify-center', () => (0, tailwind_converter_1.cssToTailwind)('justify-content', 'center') === 'justify-center');
test('Width 100% → w-full', () => (0, tailwind_converter_1.cssToTailwind)('width', '100%') === 'w-full');
test('Height auto → h-auto', () => (0, tailwind_converter_1.cssToTailwind)('height', 'auto') === 'h-auto');
test('Unsupported property → null', () => (0, tailwind_converter_1.cssToTailwind)('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)') === null);
// Edge Cases
test('Case-insensitive property → p-4', () => (0, tailwind_converter_1.cssToTailwind)('PADDING', '16px') === 'p-4');
test('Case-insensitive color → bg-blue-500', () => (0, tailwind_converter_1.cssToTailwind)('background-color', '#3B82F6') === 'bg-blue-500');
test('Whitespace handling → p-4', () => (0, tailwind_converter_1.cssToTailwind)('padding', '  16px  ') === 'p-4');
test('Arbitrary size → p-[123px]', () => (0, tailwind_converter_1.cssToTailwind)('padding', '123px') === 'p-[123px]');
console.log(`\n${'='.repeat(60)}`);
console.log(`Tests Passed: ${passed}`);
console.log(`Tests Failed: ${failed}`);
console.log(`Total Tests: ${passed + failed}`);
console.log(`${'='.repeat(60)}`);
if (failed > 0) {
    throw new Error(`${failed} test(s) failed`);
}
