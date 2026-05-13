import { cssToTailwind, segmentToTailwind } from "./tailwind-converter";

const DOMIFY_CONFIG = {
  ignoredProperties: ["font-feature-settings", "font-family"],
};

const CURRENT_NODE_LAYOUT_PROPS = new Set([
  "display",
  "box-sizing",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "overflow",
  "overflow-x",
  "overflow-y",
  "flex",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "flex-direction",
  "flex-wrap",
  "justify-content",
  "align-items",
  "align-content",
  "align-self",
  "order",
  "gap",
  "row-gap",
  "column-gap",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
]);

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
  isDefinition: boolean;
  mainComponentId: string | null;
  mainComponentKey: string | null;
  mainComponentName: string | null;
  componentProps: Record<string, string | boolean> | null;
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
  figmaComponent: boolean;
  textStyle: boolean;
};

type DomifyContext = {
  cssMap: Map<string, Set<string>>;
  warnings: Set<string>;
  fileUrl: string | null;
  classNames: Map<string, string>;
  dataAttrs: DataAttrConfig;
  framework: string;
  cssMode: "plain" | "tailwind4";
  componentDepth: "expandAll" | "collapseTagged";
  showAnnotations: boolean;
  categoryMap: Map<string, string>;
};

const PLUGIN_DATA_KEY = 'componentName';
const PLUGIN_SCOPE_KEY = 'componentScope';

function showTagUI(): void {
  figma.showUI(__html__, { visible: true, width: 300, height: 360 });
  figma.on('selectionchange', () => sendSelectionInfo());
  figma.ui.onmessage = handleUIMessage;
  sendSelectionInfo();
  sendTagList();
}

if (figma.mode === 'inspect') {
  showTagUI();
}

figma.codegen.on('preferenceschange', async (event) => {
  if (event.propertyName === 'tagComponents') {
    showTagUI();
  }
  if (event.propertyName === 'componentDepth') {
    figma.codegen.refresh();
  }
});

initCodegen();

async function handleUIMessage(msg: { type: string; nodeId?: string; name?: string; scoped?: boolean }): Promise<void> {
  if (msg.type === 'init') {
    sendSelectionInfo();
    sendTagList();
  }

  if (msg.type === 'tag' && msg.nodeId && msg.name) {
    const node = await figma.getNodeByIdAsync(msg.nodeId);
    if (node) {
      (node as SceneNode).setPluginData(PLUGIN_DATA_KEY, msg.name);
      const ancestor = findNearestTaggedAncestor(node);
      const scopeValue = msg.scoped && ancestor ? ancestor.nodeId : '';
      (node as SceneNode).setPluginData(PLUGIN_SCOPE_KEY, scopeValue);
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
      (node as SceneNode).setPluginData(PLUGIN_SCOPE_KEY, '');
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
  const ancestor = findNearestTaggedAncestor(node);
  figma.ui.postMessage({
    type: 'selection',
    node: {
      id: node.id,
      name: node.name,
      type: node.type,
      tag: node.getPluginData(PLUGIN_DATA_KEY) || null,
      scoped: node.getPluginData(PLUGIN_SCOPE_KEY) || null,
      ancestor,
    },
  });
}

type TagEntry = {
  nodeId: string;
  nodeName: string;
  componentName: string;
  scopeParentId: string | null;
  topLevelLayerName: string;
};

function sendTagList(): void {
  const tags: TagEntry[] = [];
  collectTags(figma.currentPage, tags);
  figma.ui.postMessage({ type: 'tag-list', tags });
}

function collectTags(
  node: BaseNode,
  tags: TagEntry[],
): void {
  if ('getPluginData' in node) {
    const tag = (node as SceneNode).getPluginData(PLUGIN_DATA_KEY);
    if (tag) {
      const scope = (node as SceneNode).getPluginData(PLUGIN_SCOPE_KEY);
      tags.push({
        nodeId: node.id,
        nodeName: node.name,
        componentName: tag,
        scopeParentId: scope || null,
        topLevelLayerName: findTopLevelLayerName(node),
      });
    }
  }
  if ('children' in node) {
    for (const child of (node as ChildrenMixin).children) {
      collectTags(child, tags);
    }
  }
}

function findTopLevelLayerName(node: BaseNode): string {
  let current: BaseNode = node;
  while (current.parent && current.parent.type !== 'PAGE') {
    current = current.parent;
  }
  return current.name;
}

function getViewportSize(node: SceneNode): { name: string; width: number; height: number } | null {
  let current: BaseNode = node;
  while (current.parent && current.parent.type !== 'PAGE') {
    current = current.parent;
  }
  if ('width' in current && 'height' in current) {
    const w = current.width;
    const h = current.height;
    if (typeof w === 'number' && typeof h === 'number') {
      return { name: current.name, width: Math.round(w), height: Math.round(h) };
    }
  }
  return null;
}

function findNearestTaggedAncestor(node: BaseNode): { nodeId: string; componentName: string } | null {
  let current = node.parent;
  while (current) {
    if ('getPluginData' in current) {
      const tag = (current as SceneNode).getPluginData(PLUGIN_DATA_KEY);
      if (tag) {
        return { nodeId: current.id, componentName: tag };
      }
    }
    current = current.parent;
  }
  return null;
}

function buildDataAttrConfig(preset: string): DataAttrConfig {
  if (preset === 'none') {
    return { component: false, nodeName: false, nodeId: false, nodeType: false, url: false, provenance: false, figmaComponent: false, textStyle: false };
  }
  if (preset === 'minimal') {
    return { component: true, nodeName: true, nodeId: false, nodeType: false, url: false, provenance: false, figmaComponent: true, textStyle: true };
  }
  return { component: true, nodeName: true, nodeId: true, nodeType: true, url: true, provenance: true, figmaComponent: true, textStyle: true };
}

function initCodegen(): void {
figma.codegen.on("generate", async (event) => {
  const classNames = buildClassNameMap(event.node);
  const s = figma.codegen.preferences.customSettings;
  const framework = s["framework"] ?? "none";
  const cssMode = s["cssMode"] ?? "plain";
  const dataPreset = s["dataAttributes"] ?? "all";
  const componentDepth = (s["componentDepth"] ?? "expandAll") as "expandAll" | "collapseTagged";
  const showAnnotations = (s["annotations"] ?? "show") !== "hide";

  const categoryMap = new Map<string, string>();
  if (showAnnotations) {
    const categories = await figma.annotations.getAnnotationCategoriesAsync();
    for (const cat of categories) {
      categoryMap.set(cat.id, cat.label);
    }
  }

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
    componentDepth,
    showAnnotations,
    categoryMap,
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
      { title: "Layout (current node)", language: "CSS", code: "/* Selected node is hidden */" },
      { title: "Style (current node)", language: "CSS", code: "/* Selected node is hidden */" },
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
  const currentNodeCss = await buildCurrentNodeCssSections(event.node);

  const viewport = getViewportSize(event.node);
  const viewportComment = viewport
    ? `<!-- @viewport: ${viewport.name} (${viewport.width}x${viewport.height}) -->\n`
    : '';

  return [
    { title: "HTML", language: "HTML", code: viewportComment + rootResult.html },
    { title: "CSS", language: "CSS", code: cssText },
    { title: "Layout (current node)", language: "CSS", code: currentNodeCss.layout },
    { title: "Style (current node)", language: "CSS", code: currentNodeCss.style },
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

  const annotationPrefix = formatAnnotationComments(node, context, depth);

  if ("isAsset" in node && node.isAsset) {
    const result = await renderAssetNode(node, context, depth);
    if (result && annotationPrefix) {
      result.html = `${annotationPrefix}${result.html}`;
    }
    return result;
  }

  const className = context.classNames.get(node.id) ?? toClassName(node.name);
  const metadata = await buildMetadata(node, context.fileUrl);

  if (node.type === "TEXT") {
    const result = await renderTextNode(node, className, metadata, context, depth);
    if (annotationPrefix) {
      result.html = `${annotationPrefix}${result.html}`;
    }
    return result;
  }
  const isTaggedComponent = !!node.getPluginData(PLUGIN_DATA_KEY);
  const shouldCollapse = depth > 0 && context.componentDepth === "collapseTagged" && isTaggedComponent;
  const children = shouldCollapse ? [] : ("children" in node ? Array.from(node.children) : []);

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
    if (shouldCollapse) {
      return {
        html: `${annotationPrefix}${indent(depth)}<div${attrs}>\n${indent(depth + 1)}<!-- children collapsed -->\n${indent(depth)}</div>`,
        metadata,
      };
    }
    return {
      html: `${annotationPrefix}${indent(depth)}<div${attrs}></div>`,
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
      html: `${annotationPrefix}${indent(depth)}<div${attrs}></div>`,
      metadata,
    };
  }

  return {
    html: `${annotationPrefix}${indent(depth)}<div${attrs}>\n${renderedChildren.map((c) => c.html).join("\n")}\n${indent(depth)}</div>`,
    metadata: {
      ...metadata,
      children: renderedChildren.map((c) => c.metadata),
    },
  };
}

const SEGMENT_FIELDS = [
  'fontSize', 'fontName', 'fontWeight', 'fills',
  'letterSpacing', 'lineHeight', 'textDecoration', 'textCase',
  'textStyleId',
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
  textStyleId: string;
};

async function renderTextNodePlain(
  node: TextNode,
  className: string,
  metadata: DomifyMetadataNode,
  context: DomifyContext,
  depth: number,
): Promise<DomifyRenderResult> {
  await collectCssRule(node, className, context.cssMap);
  const textStyleName = await resolveNodeTextStyleName(node);
  const attrs = toAttributes(node, className, metadata.provenance, metadata.url,
    context.dataAttrs, context.framework, context.cssMode, [], textStyleName);
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
  const textStyleName = await resolveNodeTextStyleName(node);
  const attrs = toAttributes(node, className, metadata.provenance, metadata.url,
    context.dataAttrs, context.framework, context.cssMode, tailwindClasses, textStyleName);
  return {
    html: `${indent(depth)}<span${attrs}>${escapeHtml(node.characters ?? '')}</span>`,
    metadata,
  };
}

async function renderTextNodeMixed(
  node: TextNode,
  className: string,
  metadata: DomifyMetadataNode,
  context: DomifyContext,
  depth: number,
  segments: TextSegment[],
): Promise<DomifyRenderResult> {
  const styleNameMap = await resolveSegmentTextStyles(context, segments);

  const spanLines = segments.map((seg) => {
    const style = extractSegmentStyle(seg);
    const classes = segmentToTailwind(style);
    const classAttrName = context.framework === 'react' ? 'className' : 'class';
    const classAttr = classes.length > 0 ? ` ${classAttrName}="${classes.join(' ')}"` : '';
    const textStyleName = styleNameMap.get(seg.textStyleId);
    const textStyleAttr = textStyleName
      ? ` data-figma-text-style="${escapeHtml(textStyleName)}"`
      : '';
    return `${indent(depth + 1)}<span${textStyleAttr}${classAttr}>${escapeHtml(seg.characters)}</span>`;
  });

  const wrapperAttrs = toAttributes(node, className, metadata.provenance, metadata.url,
    context.dataAttrs, context.framework, context.cssMode, []);

  return {
    html: `${indent(depth)}<span${wrapperAttrs}>\n${spanLines.join('\n')}\n${indent(depth)}</span>`,
    metadata,
  };
}

async function resolveSegmentTextStyles(
  context: DomifyContext,
  segments: TextSegment[],
): Promise<Map<string, string>> {
  const styleNameMap = new Map<string, string>();
  if (!context.dataAttrs.textStyle) return styleNameMap;

  const uniqueIds = [...new Set(segments.map(s => s.textStyleId).filter(Boolean))];
  await Promise.all(uniqueIds.map(async (id) => {
    const name = await resolveTextStyleName(id);
    if (name) styleNameMap.set(id, name);
  }));
  return styleNameMap;
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

  const assetImageSrc = await resolveAssetImageSrc(node);
  if (assetImageSrc) {
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
      html: `${indent(depth)}<img${attrs} src="${assetImageSrc}" alt="asset:${escapeHtml(node.id)}" width="${w}" height="${h}" />`,
      metadata,
    };
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

  try {
    const pngBytes = await node.exportAsync({ format: "PNG" });
    const pngSrc = bytesToDataUri(pngBytes, "image/png");
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
      html: `${indent(depth)}<img${attrs} src="${pngSrc}" alt="asset:${escapeHtml(node.id)}" width="${w}" height="${h}" />`,
      metadata,
    };
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

async function resolveAssetImageSrc(node: SceneNode): Promise<string | null> {
  if (!("fills" in node) || !Array.isArray(node.fills)) {
    return null;
  }

  const imagePaint = node.fills.find(
    (fill): fill is ImagePaint =>
      fill.type === "IMAGE" &&
      fill.visible !== false &&
      typeof fill.imageHash === "string" &&
      fill.imageHash.length > 0,
  );
  if (!imagePaint) {
    return null;
  }

  const imageHash = imagePaint.imageHash;
  if (!imageHash) {
    return null;
  }

  const image = figma.getImageByHash(imageHash);
  if (!image) {
    return null;
  }

  const bytes = await image.getBytesAsync();
  if (bytes.length === 0) {
    return null;
  }

  return bytesToDataUri(bytes, detectImageMimeType(bytes));
}

function detectImageMimeType(bytes: Uint8Array): string {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return "application/octet-stream";
}

function bytesToDataUri(bytes: Uint8Array, mimeType: string): string {
  return `data:${mimeType};base64,${bytesToBase64(bytes)}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i] ?? 0;
    const byte2 = bytes[i + 1] ?? 0;
    const byte3 = bytes[i + 2] ?? 0;
    const chunk = (byte1 << 16) | (byte2 << 8) | byte3;

    output += alphabet[(chunk >> 18) & 63];
    output += alphabet[(chunk >> 12) & 63];
    output += i + 1 < bytes.length ? alphabet[(chunk >> 6) & 63] : "=";
    output += i + 2 < bytes.length ? alphabet[chunk & 63] : "=";
  }

  return output;
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

async function buildCurrentNodeCssSections(
  node: SceneNode,
): Promise<{ layout: string; style: string }> {
  const nodeCss = await node.getCSSAsync();
  const entries = Object.entries(nodeCss)
    .filter(([prop]) => !DOMIFY_CONFIG.ignoredProperties.includes(prop))
    .map(([prop, val]) => [prop, stripInlineComments(val)] as const);

  const layoutEntries = entries.filter(([prop]) => CURRENT_NODE_LAYOUT_PROPS.has(prop));
  const styleEntries = entries.filter(([prop]) => !CURRENT_NODE_LAYOUT_PROPS.has(prop));

  return {
    layout: formatCurrentNodeCssSection(layoutEntries, "/* No layout properties for current node. */"),
    style: formatCurrentNodeCssSection(styleEntries, "/* No style properties for current node. */"),
  };
}

function formatCurrentNodeCssSection(
  entries: readonly (readonly [string, string])[],
  emptyText: string,
): string {
  if (entries.length === 0) {
    return emptyText;
  }
  return entries.map(([prop, value]) => `${prop}: ${value};`).join("\n");
}

async function collectTailwindClasses(
  node: SceneNode,
  className: string,
  context: DomifyContext,
): Promise<string[]> {
  const nodeCss = await node.getCSSAsync();
  const skipProps = buildSkipProps(node);
  const cssProperties = Object.entries(nodeCss)
    .filter(([prop]) => !DOMIFY_CONFIG.ignoredProperties.includes(prop))
    .filter(([prop]) => !skipProps.has(prop))
    .map(([prop, val]) => [prop, stripInlineComments(val)] as const);

  const tailwindClasses: string[] = [];
  const nativePadding = resolveNativePadding(node);
  if (nativePadding) tailwindClasses.push(nativePadding);
  const letterSpacingOverride = resolveLetterSpacing(node);

  for (const [prop, value] of cssProperties) {
    if (prop === 'letter-spacing' && letterSpacingOverride) {
      tailwindClasses.push(letterSpacingOverride);
      continue;
    }
    const tailwindClass = cssToTailwind(prop, value);
    if (tailwindClass === '') continue;
    const fallbackClass = toArbitraryProperty(prop, value);
    if (tailwindClass) {
      tailwindClasses.push(tailwindClass);
    } else if (fallbackClass) {
      tailwindClasses.push(fallbackClass);
    }
  }

  return dedupeClasses(tailwindClasses);
}

function buildSkipProps(node: SceneNode): Set<string> {
  const skip = new Set<string>();
  if ('layoutSizingHorizontal' in node) {
    const h = (node as FrameNode).layoutSizingHorizontal;
    if (h === 'FILL' || h === 'HUG') {
      skip.add('width');
      skip.add('min-width');
      skip.add('max-width');
    }
  }
  if ('layoutSizingVertical' in node) {
    const v = (node as FrameNode).layoutSizingVertical;
    if (v === 'FILL' || v === 'HUG') {
      skip.add('height');
      skip.add('min-height');
      skip.add('max-height');
    }
  }
  if (hasNativePadding(node)) {
    skip.add('padding');
    skip.add('padding-top');
    skip.add('padding-right');
    skip.add('padding-bottom');
    skip.add('padding-left');
  }
  return skip;
}

function isAutoLayout(node: SceneNode): boolean {
  return 'layoutMode' in node && (node as FrameNode).layoutMode !== 'NONE';
}

function hasNativePadding(node: SceneNode): boolean {
  return 'paddingTop' in node;
}

function resolveNativePadding(node: SceneNode): string | null {
  if (!hasNativePadding(node)) return null;
  const frame = node as FrameNode;
  const t = frame.paddingTop ?? 0;
  const r = frame.paddingRight ?? 0;
  const b = frame.paddingBottom ?? 0;
  const l = frame.paddingLeft ?? 0;
  if (t === 0 && r === 0 && b === 0 && l === 0) return null;
  if (t === b && r === l && t === r) return cssToTailwind('padding', `${t}px`);
  if (t === b && r === l) return cssToTailwind('padding', `${t}px ${r}px`);
  return cssToTailwind('padding', `${t}px ${r}px ${b}px ${l}px`);
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

function toArbitraryProperty(prop: string, value: string): string | null {
  if (!isSafeArbitraryValue(value)) {
    return null;
  }
  const escaped = value.replace(/\s+/g, '_').replace(/'/g, "\\'");
  return `[${prop}:${escaped}]`;
}

function isSafeArbitraryValue(value: string): boolean {
  if (/(?:url|image-set)\s*\(/i.test(value)) return false;
  if (value.includes('[') || value.includes(']')) return false;
  return true;
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

async function resolveTextStyleName(styleId: string): Promise<string | null> {
  const style = await figma.getStyleByIdAsync(styleId);
  return style?.name ?? null;
}

async function resolveNodeTextStyleName(node: TextNode): Promise<string | null> {
  const styleId = node.textStyleId;
  if (typeof styleId !== 'string' || !styleId) return null;
  return resolveTextStyleName(styleId);
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
  textStyleName?: string | null,
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
  if (dataAttrs.figmaComponent && provenance.mainComponentName) {
    const obj: Record<string, unknown> = { name: provenance.mainComponentName, nodeId: node.id };
    if (provenance.componentProps) {
      obj.props = provenance.componentProps;
    }
    if (provenance.isDefinition) {
      obj.isDefinition = true;
    }
    const json = JSON.stringify(obj)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/'/g, "&#39;");
    dataAttrList.push(`data-figma-component='${json}'`);
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

  if (dataAttrs.textStyle && textStyleName) {
    dataAttrList.push(`data-figma-text-style="${escapeHtml(textStyleName)}"`);
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
  const isDefinition = node.type === "COMPONENT";
  const mainComponent = isInstance ? await node.getMainComponentAsync() : null;

  let mainComponentName: string | null = null;
  let componentProps: Record<string, string | boolean> | null = null;

  if (isInstance && mainComponent) {
    mainComponentName =
      mainComponent.parent?.type === "COMPONENT_SET"
        ? mainComponent.parent.name
        : mainComponent.name;

    const props: Record<string, string | boolean> = {};
    for (const [key, prop] of Object.entries(
      (node as InstanceNode).componentProperties,
    )) {
      if (prop.type === "INSTANCE_SWAP") continue;
      const cleanKey = key.replace(/#\d+:\d+$/, "");
      props[cleanKey] = prop.value;
    }
    componentProps = Object.keys(props).length > 0 ? props : null;
  } else if (isDefinition) {
    mainComponentName =
      node.parent?.type === "COMPONENT_SET" ? node.parent.name : node.name;
  }

  return {
    isInstance,
    isDefinition,
    mainComponentId: mainComponent ? mainComponent.id : null,
    mainComponentKey:
      mainComponent && typeof mainComponent.key === "string"
        ? mainComponent.key
        : null,
    mainComponentName,
    componentProps,
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

function formatAnnotationComments(node: SceneNode, context: DomifyContext, depth: number): string {
  if (!context.showAnnotations) return '';
  if (!('annotations' in node)) return '';
  const annotations = (node as SceneNode & { annotations: readonly Annotation[] }).annotations;
  if (!annotations || annotations.length === 0) return '';

  const lines: string[] = [];
  for (const ann of annotations) {
    const text = ann.labelMarkdown ?? ann.label ?? '';
    if (!text) continue;
    const category = ann.categoryId ? context.categoryMap.get(ann.categoryId) : null;
    const prefix = category ? `@annotation(${category})` : '@annotation';
    const isMultiLine = text.includes('\n');
    if (isMultiLine) {
      const indented = text.split('\n').map(l => `${indent(depth + 1)}${l}`).join('\n');
      lines.push(`${indent(depth)}<!--\n${indent(depth + 1)}${prefix}:\n${indented}\n${indent(depth)}-->`);
    } else {
      lines.push(`${indent(depth)}<!-- ${prefix}: ${text} -->`);
    }
  }
  return lines.length > 0 ? lines.join('\n') + '\n' : '';
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
