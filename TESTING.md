# Manual Testing Guide - Tailwind v4 CSS Generation

## Setup

1. **Load the Plugin in Figma**
   - Open Figma desktop application
   - Go to **Plugins → Development → Import plugin from manifest**
   - Select `manifest.json` from this project directory
   - The plugin should appear in the Development plugins list

2. **Enable Dev Mode**
   - In Figma, enable **Dev Mode** (toggle in top-right)
   - Open the test file: https://www.figma.com/design/iaeWKVf2BnGrIdIR54lbra/PRGMS---Courses---Project?node-id=5018-7965&m=dev

3. **Configure CSS Mode**
   - In the Code panel (right sidebar), find the **CSS Mode** preference
   - Select **"Tailwind v4"** to test Tailwind generation
   - Select **"Plain CSS"** to verify backward compatibility

---

## Test Cases

### Test 1: Simple Rectangle with Padding
**Setup**: Create a rectangle frame with `padding: 16px` (all sides)

**Expected Output (Tailwind Mode)**:
```html
<div class="rectangle p-4" data-css-mode="tailwind4"></div>
```

**Expected Output (Plain CSS Mode)**:
```html
<div class="rectangle"></div>
```
```css
.rectangle {
  padding: 16px;
}
```

**Verification**:
- [ ] Tailwind mode shows `p-4` class
- [ ] Plain CSS mode shows padding in CSS tab
- [ ] Both modes work without errors

---

### Test 2: Flex Container with Gap
**Setup**: Create a frame with:
- `display: flex`
- `flex-direction: row`
- `gap: 8px`

**Expected Output (Tailwind Mode)**:
```html
<div class="container flex flex-row gap-2" data-css-mode="tailwind4"></div>
```

**Verification**:
- [ ] Shows `flex`, `flex-row`, and `gap-2` classes
- [ ] All three utilities present in class attribute
- [ ] No CSS fallback needed (all properties mapped)

---

### Test 3: Text with Multiple Properties
**Setup**: Create a text element with:
- `font-size: 16px`
- `font-weight: 600`
- `color: #000000`
- `line-height: 150%`

**Expected Output (Tailwind Mode)**:
```html
<span class="text text-base font-semibold text-black leading-150" data-css-mode="tailwind4"></span>
```

**Verification**:
- [ ] Shows `text-base` for font-size
- [ ] Shows `font-semibold` for font-weight
- [ ] Shows `text-black` for color
- [ ] Shows `leading-150` for line-height (or similar)
- [ ] All utilities combined in single class attribute

---

### Test 4: Mixed Mapped/Unmapped Properties
**Setup**: Create a rectangle with:
- `padding: 16px` (mapped)
- `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` (unmapped)
- `background-color: #ffffff` (mapped)

**Expected Output (Tailwind Mode)**:
```html
<div class="rectangle p-4 bg-white" data-css-mode="tailwind4"></div>
```

**CSS Tab**:
```css
.rectangle {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

**Verification**:
- [ ] Mapped properties appear as Tailwind classes
- [ ] Unmapped properties appear in CSS tab
- [ ] Both sections present and correct

---

### Test 5: Custom Colors (Not in Palette)
**Setup**: Create a rectangle with `background-color: #ff00ff` (custom magenta)

**Expected Output (Tailwind Mode)**:
```html
<div class="rectangle bg-[#ff00ff]" data-css-mode="tailwind4"></div>
```

**Verification**:
- [ ] Uses arbitrary value syntax `bg-[#ff00ff]`
- [ ] Color is preserved exactly
- [ ] No CSS fallback needed

---

### Test 6: Custom Sizes (Not in Scale)
**Setup**: Create a rectangle with `width: 123px` (custom size)

**Expected Output (Tailwind Mode)**:
```html
<div class="rectangle w-[123px]" data-css-mode="tailwind4"></div>
```

**Verification**:
- [ ] Uses arbitrary value syntax `w-[123px]`
- [ ] Size is preserved exactly
- [ ] No CSS fallback needed

---

### Test 7: Border Radius
**Setup**: Create a rectangle with `border-radius: 8px`

**Expected Output (Tailwind Mode)**:
```html
<div class="rectangle rounded-2" data-css-mode="tailwind4"></div>
```

**Verification**:
- [ ] Shows `rounded-2` (or appropriate scale value)
- [ ] Border radius properly converted

---

### Test 8: Border Width
**Setup**: Create a rectangle with `border: 2px solid #000000`

**Expected Output (Tailwind Mode)**:
```html
<div class="rectangle border-2 border-black" data-css-mode="tailwind4"></div>
```

**Verification**:
- [ ] Shows `border-2` for width
- [ ] Shows `border-black` for color
- [ ] Both utilities present

---

### Test 9: Opacity
**Setup**: Create a rectangle with `opacity: 0.5`

**Expected Output (Tailwind Mode)**:
```html
<div class="rectangle opacity-50" data-css-mode="tailwind4"></div>
```

**Verification**:
- [ ] Shows `opacity-50` (50% opacity)
- [ ] Opacity properly converted from decimal

---

### Test 10: Vue Framework Mode
**Setup**: 
1. Create a simple frame with padding
2. In Code panel, select **Framework: Vue**
3. Select **CSS Mode: Tailwind v4**

**Expected Output**:
```html
<div :class="[$style.container, 'p-4']"></div>
```

**Verification**:
- [ ] Uses Vue `:class` binding
- [ ] Uses array syntax with `$style.container` and Tailwind classes
- [ ] Classes are properly separated in array

---

### Test 11: Plain CSS Mode (Backward Compatibility)
**Setup**: Select any element and switch to **CSS Mode: Plain CSS**

**Expected Output**:
```html
<div class="element"></div>
```
```css
.element {
  /* All CSS properties here */
}
```

**Verification**:
- [ ] No Tailwind classes in HTML
- [ ] All CSS properties in CSS tab
- [ ] No `data-css-mode` attribute
- [ ] Works exactly as before Tailwind feature

---

### Test 12: Empty Element
**Setup**: Create an empty frame with no CSS properties

**Expected Output (Tailwind Mode)**:
```html
<div class="empty-frame" data-css-mode="tailwind4"></div>
```

**Verification**:
- [ ] No extra spaces in class attribute
- [ ] Element renders without errors
- [ ] No empty CSS rules

---

### Test 13: Nested Elements
**Setup**: Create a frame with nested children, each with different properties

**Expected Output (Tailwind Mode)**:
```html
<div class="parent flex gap-4" data-css-mode="tailwind4">
  <div class="child p-2 bg-blue-500" data-css-mode="tailwind4"></div>
  <div class="child p-2 bg-red-500" data-css-mode="tailwind4"></div>
</div>
```

**Verification**:
- [ ] Each element has correct Tailwind classes
- [ ] Nesting structure preserved
- [ ] All elements have `data-css-mode` attribute

---

### Test 14: Asset Nodes (SVG/Images)
**Setup**: Create a frame with an embedded SVG or image

**Expected Output (Tailwind Mode)**:
```html
<div class="asset p-4" data-css-mode="tailwind4" data-figma-asset="svg">
  <!-- SVG content or placeholder -->
</div>
```

**Verification**:
- [ ] Asset nodes properly handled
- [ ] Tailwind classes applied to asset container
- [ ] `data-figma-asset` attribute present

---

## Edge Cases to Test

### Edge Case 1: Very Long Class List
**Setup**: Create element with many CSS properties

**Verification**:
- [ ] All classes present in output
- [ ] No truncation or loss of classes
- [ ] HTML attribute length within limits

### Edge Case 2: Special Characters in Names
**Setup**: Create frame with special characters in name (e.g., "Button (Primary)")

**Verification**:
- [ ] Class name properly escaped/converted
- [ ] No HTML syntax errors
- [ ] Special characters handled correctly

### Edge Case 3: Duplicate Class Names
**Setup**: Create multiple elements with same name

**Verification**:
- [ ] Duplicate detection works
- [ ] Unique identifiers added (e.g., `element--7996`)
- [ ] No class name collisions

---

## Regression Tests (Ensure Backward Compatibility)

### Regression 1: Plain CSS Mode Still Works
- [ ] Switch to Plain CSS mode
- [ ] Generate code for any element
- [ ] Verify CSS output is correct
- [ ] No Tailwind classes appear

### Regression 2: Data Attributes Still Work
- [ ] Enable "Include Data Attributes" in preferences
- [ ] Verify `data-figma-node-id`, `data-figma-node-type`, etc. present
- [ ] Disable and verify they're removed

### Regression 3: Framework Modes Still Work
- [ ] Test with Framework: None
- [ ] Test with Framework: Vue
- [ ] Verify correct output for each

---

## Performance Tests

### Performance 1: Large Design
**Setup**: Select a large frame with 50+ nested elements

**Verification**:
- [ ] Code generation completes within 15 seconds
- [ ] No timeout errors
- [ ] All elements properly converted

### Performance 2: Complex Styling
**Setup**: Select element with many CSS properties

**Verification**:
- [ ] Conversion completes quickly
- [ ] No performance degradation
- [ ] Output is correct

---

## Bug Report Template

If you find an issue, please document:

```
**Title**: [Brief description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots**:
[Attach if helpful]

**Environment**:
- Figma Version: [e.g., 2.0.0]
- Plugin Version: [e.g., 1.1.0]
- CSS Mode: [Tailwind v4 / Plain CSS]
- Framework: [None / Vue]
```

---

## Success Criteria

✅ **All tests pass** when:
- [ ] All 14 test cases produce expected output
- [ ] All edge cases handled correctly
- [ ] All regression tests pass
- [ ] Performance is acceptable
- [ ] No console errors or warnings
- [ ] Plugin doesn't crash or timeout

---

## Notes

- Test with both **Tailwind v4** and **Plain CSS** modes
- Test with both **Framework: None** and **Framework: Vue**
- Test with **Data Attributes: Include** and **Exclude**
- Check browser console for any errors (F12 in Figma)
- Verify generated code is valid HTML/CSS

---

## Next Steps After Testing

1. **If all tests pass**: Implementation is ready for production
2. **If issues found**: Document in bug report and create fixes
3. **If edge cases fail**: Add handling for those cases
4. **Performance issues**: Optimize conversion logic if needed

