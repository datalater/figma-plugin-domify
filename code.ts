import { cssToTailwind, segmentToTailwind } from "./tailwind-converter";

const DOMIFY_CONFIG = {
  ignoredProperties: ["font-feature-settings", "font-family"],
};

type DomifyNodeType =
  | "FRAME"
  | "GROUP"
  | "COMPONENT"
  | "COMPONENT_SET"
  | "INSTANCE"
  | "TEXT"
  | "VECTOR"
  | "BOOLEAN_OPERATION"
  | "ELLIPSE"
  | "POLYGON"
  | "STAR"
  | "RECTANGLE"
  | "LINE"
  | "SECTION"
  | "SLICE"
  | string;

type DomifyProvenance = {
  isInstance: boolean;
  mainComponentId: string | null;
  mainComponentKey: string | null;
  componentKey: string | null;
};

type DomifyMetadataNode = {
  id: string;
  type: DomifyNodeType;
  name: string;
  url: string | null;
  visible: boolean;
  provenance: DomifyProvenance;
  children?: DomifyMetadataNode[];
};

type DomifyRenderResult = {
  html: string;
  metadata: DomifyMetadataNode;
};

type DataAttrConfig = {
  component: boolean;
  nodeName: boolean;
  nodeId: boolean;
  nodeType: boolean;
  url: boolean;
  provenance: boolean;
};

type DomifyContext = {
  cssMap: Map<string, Set<string>>;
  warnings: Set<string>;
  fileUrl: string | null;
  classNames: Map<string, string>;
  dataAttrs: DataAttrConfig;
  framework: string;
  cssMode: "plain" | "tailwind4";
};

const PLUGIN_DATA_KEY = 'componentName';

figma.codegen.on('preferenceschange', async (event) => {
  if (event.propertyName === 'tagComponents') {
    figma.showUI(__html__, { visible: true, width: 280, height: 360 });
    figma.on('selectionchange', () => sendSelectionInfo());
    figma.ui.onmessage = handleUIMessage;
    sendSelectionInfo();
    sendTagList();
  }
});

initCodegen();

async function handleUIMessage(msg: { type: string; nodeId?: string; name?: string }): Promise<void> {
  if (msg.type === 'init') {
    sendSelectionInfo();
    sendTagList();
  }

  if (msg.type === 'tag' && msg.nodeId && msg.name) {
    const node = await figma.getNodeByIdAsync(msg.nodeId);
    if (node) {
      (node as SceneNode).setPluginData(PLUGIN_DATA_KEY, msg.name);
      sendSelectionInfo();
      sendTagList();
      figma.codegen.refresh();
    }
  }

  if (msg.type === 'navigate' && msg.nodeId) {
    const node = await figma.getNodeByIdAsync(msg.nodeId);
    if (node) {
      figma.currentPage.selection = [node as SceneNode];
      figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
    }
  }

  if (msg.type === 'remove-tag' && msg.nodeId) {
    const node = await figma.getNodeByIdAsync(msg.nodeId);
    if (node) {
      (node as SceneNode).setPluginData(PLUGIN_DATA_KEY, '');
      sendSelectionInfo();
      sendTagList();
      figma.codegen.refresh();
    }
  }
}

function sendSelectionInfo(): void {
  const sel = figma.currentPage.selection;
  if (sel.length === 0) {
    figma.ui.postMessage({ type: 'selection', node: null });
    return;
  }
  const node = sel[0];
  figma.ui.postMessage({
    type: 'selection',
    node: {
      id: node.id,
      name: node.name,
      type: node.type,
      tag: node.getPluginData(PLUGIN_DATA_KEY) || null,
    },
  });
}

function sendTagList(): void {
  const tags: Array<{ nodeId: string; nodeName: string; componentName: string }> = [];
  collectTags(figma.currentPage, tags);
  figma.ui.postMessage({ type: 'tag-list', tags });
}

function collectTags(
  node: BaseNode,
  tags: Array<{ nodeId: string; nodeName: string; componentName: string }>,
): void {
  if ('getPluginData' in node) {
    const tag = (node as SceneNode).getPluginData(PLUGIN_DATA_KEY);
    if (tag) {
      tags.push({ nodeId: node.id, nodeName: node.name, componentName: tag });
    }
  }
  if ('children' in node) {
    for (const child of (node as ChildrenMixin).children) {
      collectTags(child, tags);
    }
  }
}

function buildDataAttrConfig(preset: string): DataAttrConfig {
  if (preset === 'none') {
    return { component: false, nodeName: false, nodeId: false, nodeType: false, url: false, provenance: false };
  }
  if (preset === 'minimal') {
    return { component: true, nodeName: true, nodeId: false, nodeType: false, url: false, provenance: false };
  }
  return { component: true, nodeName: true, nodeId: true, nodeType: true, url: true, provenance: true };
}

function initCodegen(): void {
figma.codegen.on("generate", async (event) => {
  const classNames = buildClassNameMap(event.node);
  const s = figma.codegen.preferences.customSettings;
  const framework = s["framework"] ?? "none";
  const cssMode = s["cssMode"] ?? "plain";
  const dataPreset = s["dataAttributes"] ?? "all";

  if (framework === "vue") {
    for (const [id, name] of classNames) {
      classNames.set(id, toCamelCase(name));
    }
  }

  const context: DomifyContext = {
    cssMap: new Map<string, Set<string>>(),
    warnings: new Set<string>(),
    fileUrl: getFileUrl(),
    classNames,
    dataAttrs: buildDataAttrConfig(dataPreset),
    framework,
    cssMode: cssMode as "plain" | "tailwind4",
  };

  const rootResult = await renderNode(event.node, context, 0);
  if (!rootResult) {
    return [
      {
        title: "HTML",
        language: "HTML",
        code: "<!-- Selected node is hidden -->",
      },
      { title: "CSS", language: "CSS", code: "/* Selected node is hidden */" },
      { title: "Metadata", language: "PLAINTEXT", code: "{}" },
    ];
  }

  const metadataPayload = {
    generatedAt: new Date().toISOString(),
    plugin: "domify-mvp",
    selectedNodeId: event.node.id,
    selectedNodeType: event.node.type,
    selectedNodeName: event.node.name,
    figmaUrl: toNodeUrl(context.fileUrl, event.node.id),
    warnings: Array.from(context.warnings),
    tree: rootResult.metadata,
    cssMode: context.cssMode,
  };

  const cssText =
    context.cssMode === "tailwind4"
      ? formatTailwindCssOutput(context.cssMap)
      : formatCssOutput(context.cssMap);

  return [
    { title: "HTML", language: "HTML", code: rootResult.html },
    { title: "CSS", language: "CSS", code: cssText },
    {
      title: "Metadata",
      language: "PLAINTEXT",
      code: JSON.stringify(metadataPayload, null, 2),
    },
  ];
});
}

async function renderNode(
  node: SceneNode,
  context: DomifyContext,
  depth: number,
): Promise<DomifyRenderResult | null> {
  if (!node.visible) return null;

  if ("isAsset" in node && node.isAsset) {
    return renderAssetNode(node, context, depth);
  }

  const className = context.classNames.get(node.id) ?? toClassName(node.name);
  const metadata = await buildMetadata(node, context.fileUrl);

  if (node.type === "TEXT") {
    return renderTextNode(node, className, metadata, context, depth);
  }

  const children = "children" in node ? Array.from(node.children) : [];

  let tailwindClasses: string[] = [];
  if (context.cssMode === "tailwind4") {
    tailwindClasses = await collectTailwindClasses(node, className, context);
  } else {
    await collectCssRule(node, className, context.cssMap);
  }

  const attrs = toAttributes(
    node,
    className,
    metadata.provenance,
    metadata.url,
    context.dataAttrs,
    context.framework,
    context.cssMode,
    tailwindClasses,
  );
  if (children.length === 0) {
    return {
      html: `${indent(depth)}<div${attrs}></div>`,
      metadata,
    };
  }

  const allChildren = await Promise.all(
    children.map((child) => renderNode(child, context, depth + 1)),
  );
  const renderedChildren = allChildren.filter(
    (c): c is DomifyRenderResult => c !== null,
  );

  if (renderedChildren.length === 0) {
    return {
      html: `${indent(depth)}<div${attrs}></div>`,
      metadata,
    };
  }

  return {
    html: `${indent(depth)}<div${attrs}>\n${renderedChildren.map((c) => c.html).join("\n")}\n${indent(depth)}</div>`,
    metadata: {
      ...metadata,
      children: renderedChildren.map((c) => c.metadata),
    },
  };
}

const SEGMENT_FIELDS = [
  'fontSize', 'fontName', 'fontWeight', 'fills',
  'letterSpacing', 'lineHeight', 'textDecoration', 'textCase',
] as const;

async function renderTextNode(
  node: TextNode,
  className: string,
  metadata: DomifyMetadataNode,
  context: DomifyContext,
  depth: number,
): Promise<DomifyRenderResult> {
  if (context.cssMode !== 'tailwind4') {
    return renderTextNodePlain(node, className, metadata, context, depth);
  }

  const segments = node.getStyledTextSegments([...SEGMENT_FIELDS]);

  if (segments.length <= 1) {
    return renderTextNodeSingle(node, className, metadata, context, depth);
  }

  return renderTextNodeMixed(node, className, metadata, context, depth, segments as TextSegment[]);
}

type TextSegment = {
  characters: string;
  fontSize: number;
  fontName: FontName;
  fontWeight: number;
  fills: readonly Paint[];
  letterSpacing: LetterSpacing;
  lineHeight: LineHeight;
  textDecoration: TextDecoration;
  textCase: TextCase;
};

async function renderTextNodePlain(
  node: TextNode,
  className: string,
  metadata: DomifyMetadataNode,
  context: DomifyContext,
  depth: number,
): Promise<DomifyRenderResult> {
  await collectCssRule(node, className, context.cssMap);
  const attrs = toAttributes(node, className, metadata.provenance, metadata.url,
    context.dataAttrs, context.framework, context.cssMode, []);
  return {
    html: `${indent(depth)}<span${attrs}>${escapeHtml(node.characters ?? '')}</span>`,
    metadata,
  };
}

async function renderTextNodeSingle(
  node: TextNode,
  className: string,
  metadata: DomifyMetadataNode,
  context: DomifyContext,
  depth: number,
): Promise<DomifyRenderResult> {
  const tailwindClasses = await collectTailwindClasses(node, className, context);
  const attrs = toAttributes(node, className, metadata.provenance, metadata.url,
    context.dataAttrs, context.framework, context.cssMode, tailwindClasses);
  return {
    html: `${indent(depth)}<span${attrs}>${escapeHtml(node.characters ?? '')}</span>`,
    metadata,
  };
}

function renderTextNodeMixed(
  node: TextNode,
  className: string,
  metadata: DomifyMetadataNode,
  context: DomifyContext,
  depth: number,
  segments: TextSegment[],
): DomifyRenderResult {
  const spanLines = segments.map((seg) => {
    const style = extractSegmentStyle(seg);
    const classes = segmentToTailwind(style);
    const classAttrName = context.framework === 'react' ? 'className' : 'class';
    const classAttr = classes.length > 0 ? ` ${classAttrName}="${classes.join(' ')}"` : '';
    return `${indent(depth + 1)}<span${classAttr}>${escapeHtml(seg.characters)}</span>`;
  });

  const wrapperAttrs = toAttributes(node, className, metadata.provenance, metadata.url,
    context.dataAttrs, context.framework, context.cssMode, []);

  return {
    html: `${indent(depth)}<span${wrapperAttrs}>\n${spanLines.join('\n')}\n${indent(depth)}</span>`,
    metadata,
  };
}

function extractSegmentStyle(seg: TextSegment) {
  const fill = seg.fills && Array.isArray(seg.fills)
    ? seg.fills.find((f): f is SolidPaint => f.type === 'SOLID' && f.visible !== false)
    : null;

  const color = fill ? rgbToHexString(fill.color, fill.opacity) : null;

  const ls = seg.letterSpacing;
  const lh = seg.lineHeight;

  return {
    fontSize: seg.fontSize as number,
    fontWeight: (seg.fontWeight ?? 400) as number,
    letterSpacingValue: ls.value as number,
    letterSpacingUnit: ls.unit as 'PIXELS' | 'PERCENT',
    lineHeightValue: lh.unit === 'AUTO' ? null : lh.value as number,
    lineHeightUnit: lh.unit as 'PIXELS' | 'PERCENT' | 'AUTO',
    color,
    textDecoration: seg.textDecoration as string,
    textCase: seg.textCase as string,
    italic: (seg.fontName as FontName).style?.toLowerCase().includes('italic') ?? false,
  };
}

function rgbToHexString(color: RGB, opacity?: number): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const hex = `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  if (opacity !== undefined && opacity < 1) {
    const a = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `${hex}${a}`;
  }
  return hex;
}

const SVG_SIZE_THRESHOLD = 10000;

async function renderAssetNode(
  node: SceneNode,
  context: DomifyContext,
  depth: number,
): Promise<DomifyRenderResult> {
  const className = context.classNames.get(node.id) ?? toClassName(node.name);
  const metadata = await buildMetadata(node, context.fileUrl);
  const nodeUrl = metadata.url;
  const w =
    "width" in node && typeof node.width === "number"
      ? Math.round(node.width)
      : 100;
  const h =
    "height" in node && typeof node.height === "number"
      ? Math.round(node.height)
      : 100;

  let tailwindClasses: string[] = [];
  if (context.cssMode === "tailwind4") {
    tailwindClasses = await collectTailwindClasses(node, className, context);
  } else {
    await collectCssRule(node, className, context.cssMap);
  }

  try {
    const svgString = await node.exportAsync({ format: "SVG_STRING" });
    if (svgString.length < SVG_SIZE_THRESHOLD) {
      const attrs = toAssetAttributes(
        node,
        className,
        metadata.provenance,
        nodeUrl,
        "svg",
        context.dataAttrs,
        context.framework,
        context.cssMode,
        tailwindClasses,
      );
      return {
        html: `${indent(depth)}<div${attrs}>\n${indent(depth + 1)}${svgString}\n${indent(depth)}</div>`,
        metadata,
      };
    }
  } catch {
    /* empty */
  }

  const placeholderSrc = buildPlaceholderDataUri(node.id, nodeUrl, w, h);
  const attrs = toAssetAttributes(
    node,
    className,
    metadata.provenance,
    nodeUrl,
    "image",
    context.dataAttrs,
    context.framework,
    context.cssMode,
    tailwindClasses,
  );
  return {
    html: `${indent(depth)}<img${attrs} src="${placeholderSrc}" alt="asset:${escapeHtml(node.id)}" width="${w}" height="${h}" />`,
    metadata,
  };
}

function toAssetAttributes(
  node: SceneNode,
  className: string,
  provenance: DomifyProvenance,
  nodeUrl: string | null,
  assetType: "svg" | "image",
  dataAttrs: DataAttrConfig,
  framework: string,
  cssMode: string,
  tailwindClasses: string[] = [],
): string {
  const base = toAttributes(
    node,
    className,
    provenance,
    nodeUrl,
    dataAttrs,
    framework,
    cssMode,
    tailwindClasses,
  );
  if (dataAttrs.nodeType) {
    return `${base} data-figma-asset="${assetType}"`;
  }
  return base;
}

function buildPlaceholderDataUri(
  nodeId: string,
  nodeUrl: string | null,
  w: number,
  h: number,
): string {
  const label = `asset:${nodeId}`;
  const linkLine = nodeUrl ? nodeUrl : nodeId;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`,
    `<rect width="100%" height="100%" fill="#E0E0E0" rx="4"/>`,
    `<text x="50%" y="45%" text-anchor="middle" font-size="10" fill="#666">${escapeXml(label)}</text>`,
    `<text x="50%" y="60%" text-anchor="middle" font-size="8" fill="#999">${escapeXml(linkLine)}</text>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function collectCssRule(
  node: SceneNode,
  className: string,
  cssMap: Map<string, Set<string>>,
): Promise<void> {
  const nodeCss = await node.getCSSAsync();
  const allEntries = Object.entries(nodeCss)
    .filter(([prop]) => !DOMIFY_CONFIG.ignoredProperties.includes(prop))
    .map(([prop, val]) => [prop, stripInlineComments(val)] as const);

  const negativeGap = extractNegativeGap(allEntries);
  const entries = negativeGap
    ? allEntries.filter(([prop]) => prop !== "gap")
    : allEntries;

  if (entries.length > 0) {
    const declarations = entries
      .map(([prop, val]) => `  ${prop}: ${val};`)
      .join("\n");
    addCssEntry(cssMap, `.${className}`, declarations);
  }

  if (negativeGap) {
    const direction = allEntries.find(([prop]) => prop === "flex-direction");
    const isVertical = direction && direction[1] === "column";
    const marginProp = isVertical ? "margin-top" : "margin-left";
    addCssEntry(
      cssMap,
      `.${className} > * + *`,
      `  ${marginProp}: ${negativeGap.value};`,
    );
  }
}

async function collectTailwindClasses(
  node: SceneNode,
  className: string,
  context: DomifyContext,
): Promise<string[]> {
  const nodeCss = await node.getCSSAsync();
  const cssProperties = Object.entries(nodeCss)
    .filter(([prop]) => !DOMIFY_CONFIG.ignoredProperties.includes(prop))
    .map(([prop, val]) => [prop, stripInlineComments(val)] as const);

  const tailwindClasses: string[] = [];
  const letterSpacingOverride = resolveLetterSpacing(node);

  for (const [prop, value] of cssProperties) {
    if (prop === 'letter-spacing' && letterSpacingOverride) {
      tailwindClasses.push(letterSpacingOverride);
      continue;
    }
    const tailwindClass = cssToTailwind(prop, value);
    if (tailwindClass === '') continue;
    tailwindClasses.push(tailwindClass ?? toArbitraryProperty(prop, value));
  }

  return dedupeClasses(tailwindClasses);
}

function dedupeClasses(classes: string[]): string[] {
  const expanded: string[] = [];
  for (const c of classes) {
    for (const part of c.split(' ')) {
      expanded.push(part);
    }
  }
  const seen = new Set<string>();
  return expanded.filter((c) => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });
}

function resolveLetterSpacing(node: SceneNode): string | null {
  if (node.type !== 'TEXT') return null;
  const ls = node.letterSpacing;
  if (typeof ls === 'symbol') return null;
  if (ls.unit === 'PERCENT') {
    const em = parseFloat((ls.value / 100).toFixed(4));
    return `tracking-[${em}em]`;
  }
  return `tracking-[${ls.value}px]`;
}

function toArbitraryProperty(prop: string, value: string): string {
  const escaped = value.replace(/\s+/g, '_').replace(/'/g, "\\'");
  return `[${prop}:${escaped}]`;
}

function addCssEntry(
  cssMap: Map<string, Set<string>>,
  selector: string,
  declarations: string,
): void {
  const existing = cssMap.get(declarations);
  if (existing) {
    existing.add(selector);
  } else {
    cssMap.set(declarations, new Set([selector]));
  }
}

function formatCssOutput(cssMap: Map<string, Set<string>>): string {
  const rules: string[] = [];
  for (const [declarations, selectors] of cssMap) {
    const selectorStr = Array.from(selectors).join(",\n");
    rules.push(`${selectorStr} {\n${declarations}\n}`);
  }
  const text = rules.join("\n\n").trim();
  return text.length > 0 ? text : "/* No CSS emitted. */";
}

function formatTailwindCssOutput(cssMap: Map<string, Set<string>>): string {
  const rules: string[] = [];
  for (const [declarations, selectors] of cssMap) {
    const selectorStr = Array.from(selectors).join(",\n");
    rules.push(`${selectorStr} {\n${declarations}\n}`);
  }
  const text = rules.join("\n\n").trim();
  return text.length > 0
    ? text
    : "/* All styles mapped to Tailwind utilities. */";
}

function extractNegativeGap(
  entries: readonly (readonly [string, string])[],
): { value: string } | null {
  const gap = entries.find(([prop]) => prop === "gap");
  if (!gap) return null;
  const value = gap[1];
  if (!value.startsWith("-")) return null;
  return { value };
}

function stripInlineComments(value: string): string {
  return value.replace(/\s*\/\*[^*]*\*\/\s*/g, " ").trim();
}

function toAttributes(
  node: SceneNode,
  className: string,
  provenance: DomifyProvenance,
  nodeUrl: string | null,
  dataAttrs: DataAttrConfig,
  framework: string,
  cssMode: string,
  tailwindClasses: string[] = [],
): string {
  const dataAttrList: string[] = [];
  const otherAttrs: string[] = [];

  if (dataAttrs.component) {
    const componentTag = node.getPluginData(PLUGIN_DATA_KEY);
    if (componentTag) {
      dataAttrList.push(`data-component="${escapeHtml(componentTag)}"`);
    }
  }

  if (dataAttrs.nodeName && cssMode === "tailwind4") {
    dataAttrList.push(`data-node-name="${escapeHtml(className)}"`);
  }

  if (dataAttrs.nodeId) {
    dataAttrList.push(`data-figma-node-id="${escapeHtml(node.id)}"`);
  }
  if (dataAttrs.nodeType) {
    dataAttrList.push(`data-figma-node-type="${escapeHtml(node.type)}"`);
  }
  if (dataAttrs.url && nodeUrl) {
    dataAttrList.push(`data-figma-url="${escapeHtml(nodeUrl)}"`);
  }
  if (dataAttrs.provenance) {
    if (provenance.componentKey)
      dataAttrList.push(`data-figma-component-key="${escapeHtml(provenance.componentKey)}"`);
    if (provenance.isInstance) {
      dataAttrList.push('data-figma-instance="true"');
      if (provenance.mainComponentId)
        dataAttrList.push(`data-figma-main-component-id="${escapeHtml(provenance.mainComponentId)}"`);
      if (provenance.mainComponentKey)
        dataAttrList.push(`data-figma-main-component-key="${escapeHtml(provenance.mainComponentKey)}"`);
    }
  }

  const classAttrName = framework === "react" ? "className" : "class";
  if (cssMode === "tailwind4") {
    const twClass = tailwindClasses.join(" ");
    if (twClass.length > 0) otherAttrs.push(`${classAttrName}="${twClass}"`);
  } else if (framework === "vue") {
    otherAttrs.push(`:class="$style.${className}"`);
  } else {
    otherAttrs.push(`${classAttrName}="${className}"`);
  }

  const attrs = [...dataAttrList, ...otherAttrs];

  return ` ${attrs.join(" ")}`;
}

async function buildMetadata(
  node: SceneNode,
  fileUrl: string | null,
): Promise<DomifyMetadataNode> {
  return {
    id: node.id,
    type: node.type,
    name: node.name,
    url: toNodeUrl(fileUrl, node.id),
    visible: node.visible,
    provenance: await getProvenance(node),
  };
}

async function getProvenance(node: SceneNode): Promise<DomifyProvenance> {
  const isInstance = node.type === "INSTANCE";
  const mainComponent = isInstance ? await node.getMainComponentAsync() : null;
  return {
    isInstance,
    mainComponentId: mainComponent ? mainComponent.id : null,
    mainComponentKey:
      mainComponent && typeof mainComponent.key === "string"
        ? mainComponent.key
        : null,
    componentKey: hasOwnComponentKey(node) ? node.key : null,
  };
}

function hasOwnComponentKey(
  node: SceneNode,
): node is SceneNode & { key: string } {
  return (
    (node.type === "COMPONENT" || node.type === "COMPONENT_SET") &&
    "key" in node &&
    typeof node.key === "string"
  );
}

function buildClassNameMap(root: SceneNode): Map<string, string> {
  const nameCount = new Map<string, number>();
  const nodeNames = new Map<string, string>();
  collectNodeNames(root, nodeNames, nameCount);

  const result = new Map<string, string>();
  for (const [id, baseName] of nodeNames) {
    const count = nameCount.get(baseName) ?? 0;
    if (count > 1) {
      result.set(id, `${baseName}--${extractShortId(id)}`);
    } else {
      result.set(id, baseName);
    }
  }
  return result;
}

function collectNodeNames(
  node: SceneNode,
  names: Map<string, string>,
  counts: Map<string, number>,
): void {
  const base = toClassName(node.name);
  names.set(node.id, base);
  counts.set(base, (counts.get(base) ?? 0) + 1);
  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      collectNodeNames(child, names, counts);
    }
  }
}

function extractShortId(id: string): string {
  const parts = id.split(":");
  return parts[parts.length - 1];
}

function toClassName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized.length > 0 ? sanitized : "unnamed";
}

function toCamelCase(kebab: string): string {
  return kebab.replace(/-+([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function getFileUrl(): string | null {
  const key = getSafeFileKey();
  if (!key) return null;
  return `https://www.figma.com/design/${key}`;
}

function toNodeUrl(fileUrl: string | null, nodeId: string): string | null {
  if (!fileUrl) return null;
  return `${fileUrl}?node-id=${nodeId.replace(/:/g, "-")}&m=dev`;
}

function getSafeFileKey(): string | null {
  try {
    return typeof figma.fileKey === "string" && figma.fileKey.length > 0
      ? figma.fileKey
      : null;
  } catch {
    return null;
  }
}

function indent(depth: number): string {
  return "  ".repeat(depth);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
