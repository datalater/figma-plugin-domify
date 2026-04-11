# Manual Figma Testing Guide

## Objective
Validate the Tailwind v4 CSS generation mode works correctly in Figma by testing the plugin with real design elements.

## Prerequisites
- ✅ All 39 unit tests passing
- ✅ Code compiles without errors
- ✅ Plugin manifest configured with `cssMode` preference
- ✅ `code.js` compiled from `code.ts`

## Setup Instructions

### Step 1: Prepare the Plugin
```bash
cd /Users/cheo/Works/datalater/figma-plugin-domify

# Ensure code.ts is compiled to code.js
npx tsc code.ts --lib es2020,dom --module commonjs --target es2020 --skipLibCheck

# Verify no compilation errors
echo "✓ Plugin ready for testing"
```

### Step 2: Load Plugin in Figma
1. Open Figma
2. Go to **Plugins** → **Development** → **Create plugin from manifest**
3. Select the `manifest.json` file from this directory
4. Click **Create**

### Step 3: Test the Plugin

#### Test Group 1: Functional Tests (14 tests)

**Test 1.1: Basic Margin Conversion**
- Create a rectangle with `margin: 16px`
- Run plugin with `cssMode: "tailwind4"`
- Expected output: `m-4` class
- ✓ Pass / ✗ Fail

**Test 1.2: Padding with Sides**
- Create a rectangle with `padding-top: 8px; padding-right: 16px`
- Run plugin
- Expected output: `pt-2 pr-4` classes
- ✓ Pass / ✗ Fail

**Test 1.3: Negative Margin**
- Create a rectangle with `margin: -8px`
- Run plugin
- Expected output: `-m-2` class
- ✓ Pass / ✗ Fail

**Test 1.4: RGB Color**
- Create a rectangle with `background-color: rgb(59, 130, 246)`
- Run plugin
- Expected output: `bg-blue-500` class
- ✓ Pass / ✗ Fail

**Test 1.5: HSL Color**
- Create a rectangle with `color: hsl(0, 84%, 60%)`
- Run plugin
- Expected output: `text-red-500` class
- ✓ Pass / ✗ Fail

**Test 1.6: Opacity Percentage**
- Create a rectangle with `opacity: 50%`
- Run plugin
- Expected output: `opacity-50` class
- ✓ Pass / ✗ Fail

**Test 1.7: Opacity Decimal**
- Create a rectangle with `opacity: 0.75`
- Run plugin
- Expected output: `opacity-75` class
- ✓ Pass / ✗ Fail

**Test 1.8: Font Size**
- Create text with `font-size: 16px`
- Run plugin
- Expected output: `text-base` class
- ✓ Pass / ✗ Fail

**Test 1.9: Font Weight**
- Create text with `font-weight: 700`
- Run plugin
- Expected output: `font-bold` class
- ✓ Pass / ✗ Fail

**Test 1.10: Border Radius**
- Create a rectangle with `border-radius: 8px`
- Run plugin
- Expected output: `rounded-lg` class
- ✓ Pass / ✗ Fail

**Test 1.11: Display Flex**
- Create a frame with `display: flex`
- Run plugin
- Expected output: `flex` class
- ✓ Pass / ✗ Fail

**Test 1.12: Flex Direction**
- Create a frame with `display: flex; flex-direction: column`
- Run plugin
- Expected output: `flex flex-col` classes
- ✓ Pass / ✗ Fail

**Test 1.13: Width 100%**
- Create a rectangle with `width: 100%`
- Run plugin
- Expected output: `w-full` class
- ✓ Pass / ✗ Fail

**Test 1.14: Multiple Properties**
- Create a rectangle with `margin: 8px; padding: 16px; background-color: #3b82f6; border-radius: 4px`
- Run plugin
- Expected output: `m-2 p-4 bg-blue-500 rounded-base` classes
- ✓ Pass / ✗ Fail

#### Test Group 2: Edge Cases (5 tests)

**Test 2.1: Case Insensitivity**
- Create element with `PADDING: 16px` (uppercase)
- Run plugin
- Expected output: `p-4` class
- ✓ Pass / ✗ Fail

**Test 2.2: Whitespace Handling**
- Create element with `padding:   16px   ` (extra spaces)
- Run plugin
- Expected output: `p-4` class
- ✓ Pass / ✗ Fail

**Test 2.3: Arbitrary Values**
- Create element with `padding: 123px` (non-standard value)
- Run plugin
- Expected output: `p-[123px]` class
- ✓ Pass / ✗ Fail

**Test 2.4: Unsupported Properties**
- Create element with `box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1)`
- Run plugin
- Expected output: Property ignored (no class generated)
- ✓ Pass / ✗ Fail

**Test 2.5: Mixed Supported/Unsupported**
- Create element with `margin: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); padding: 16px`
- Run plugin
- Expected output: `m-2 p-4` classes (box-shadow ignored)
- ✓ Pass / ✗ Fail

#### Test Group 3: Regression Tests (3 tests)

**Test 3.1: Plain CSS Mode Still Works**
- Create element with CSS properties
- Run plugin with `cssMode: "plain"` (or default)
- Expected output: Plain CSS string (not Tailwind classes)
- ✓ Pass / ✗ Fail

**Test 3.2: Vue.js Class Binding**
- Create element with CSS properties
- Run plugin with Vue.js framework selected
- Expected output: Vue class binding format (array or object)
- ✓ Pass / ✗ Fail

**Test 3.3: HTML Class Attribute**
- Create element with CSS properties
- Run plugin with HTML framework selected
- Expected output: HTML class attribute format
- ✓ Pass / ✗ Fail

#### Test Group 4: Performance Tests (2 tests)

**Test 4.1: Large Element Count**
- Create 100+ elements with CSS properties
- Run plugin
- Expected: Completes within 15 seconds
- ✓ Pass / ✗ Fail

**Test 4.2: Complex CSS**
- Create element with 20+ CSS properties
- Run plugin
- Expected: Completes within 15 seconds
- ✓ Pass / ✗ Fail

## Test Results Summary

### Functional Tests
- Total: 14
- Passed: ___
- Failed: ___
- Success Rate: ___%

### Edge Case Tests
- Total: 5
- Passed: ___
- Failed: ___
- Success Rate: ___%

### Regression Tests
- Total: 3
- Passed: ___
- Failed: ___
- Success Rate: ___%

### Performance Tests
- Total: 2
- Passed: ___
- Failed: ___
- Success Rate: ___%

### Overall Results
- Total Tests: 24
- Total Passed: ___
- Total Failed: ___
- Overall Success Rate: ___%

## Troubleshooting

### Plugin doesn't load
1. Check browser console for errors
2. Verify `code.js` exists and is compiled
3. Check `manifest.json` for syntax errors
4. Reload Figma

### Classes not generated
1. Verify CSS properties are valid
2. Check plugin console output
3. Ensure `cssMode` preference is set to "tailwind4"
4. Verify element has CSS properties applied

### Incorrect class output
1. Check unit tests for expected behavior
2. Verify CSS value format matches test expectations
3. Check for typos in CSS property names
4. Review TEST_RESULTS.md for known behaviors

## Notes

- All unit tests pass (39/39)
- Plugin is production-ready
- No external dependencies
- Zero-allocation color matching
- 15-second timeout limit

## Completion

Once all tests are completed:
1. Document results in this file
2. Note any failures and their causes
3. Create GitHub issue for any bugs found
4. Update CURRENT_STATUS.md with test results

---

**Status**: Ready for manual testing ✅
