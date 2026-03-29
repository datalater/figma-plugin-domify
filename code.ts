const DOMIFY_CONFIG = {
  ignoredProperties: [
    'font-feature-settings',
    'font-family',
  ],
};

type DomifyNodeType =
  | 'FRAME'
  | 'GROUP'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'
  | 'TEXT'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'ELLIPSE'
  | 'POLYGON'
  | 'STAR'
  | 'RECTANGLE'
  | 'LINE'
  | 'SECTION'
  | 'SLICE'
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

type DomifyContext = {
  cssRules: string[];
  warnings: Set<string>;
  fileUrl: string | null;
  classNames: Map<string, string>;
};

figma.codegen.on('generate', async (event) => {
  const classNames = buildClassNameMap(event.node);
  const context: DomifyContext = {
    cssRules: [],
    warnings: new Set<string>(),
    fileUrl: getFileUrl(),
    classNames,
  };

  const rootResult = await renderNode(event.node, context, 0);
  if (!rootResult) {
    return [
      { title: 'HTML', language: 'HTML', code: '<!-- Selected node is hidden -->' },
      { title: 'CSS', language: 'CSS', code: '/* Selected node is hidden */' },
      { title: 'Metadata', language: 'PLAINTEXT', code: '{}' },
    ];
  }
  const metadataPayload = {
    generatedAt: new Date().toISOString(),
    plugin: 'domify-mvp',
    selectedNodeId: event.node.id,
    selectedNodeType: event.node.type,
    selectedNodeName: event.node.name,
    figmaUrl: toNodeUrl(context.fileUrl, event.node.id),
    warnings: Array.from(context.warnings),
    tree: rootResult.metadata,
  };

  const cssText = context.cssRules.join('\n\n').trim();
  return [
    { title: 'HTML', language: 'HTML', code: rootResult.html },
    { title: 'CSS', language: 'CSS', code: cssText.length > 0 ? cssText : '/* No CSS emitted. */' },
    { title: 'Metadata', language: 'PLAINTEXT', code: JSON.stringify(metadataPayload, null, 2) },
  ];
});

async function renderNode(node: SceneNode, context: DomifyContext, depth: number): Promise<DomifyRenderResult | null> {
  if (!node.visible) return null;

  if ('isAsset' in node && node.isAsset) {
    return renderAssetNode(node, context, depth);
  }

  const className = context.classNames.get(node.id) ?? toClassName(node.name);
  const metadata = await buildMetadata(node, context.fileUrl);
  const attrs = toAttributes(node, className, metadata.provenance, metadata.url);
  const tagName = node.type === 'TEXT' ? 'span' : 'div';
  const textContent = node.type === 'TEXT' ? escapeHtml(node.characters ?? '') : '';
  const children = 'children' in node ? Array.from(node.children) : [];

  const cssRule = await toCssRule(node, className);
  if (cssRule) context.cssRules.push(cssRule);

  if (children.length === 0) {
    return {
      html: `${indent(depth)}<${tagName}${attrs}>${textContent}</${tagName}>`,
      metadata,
    };
  }

  const allChildren = await Promise.all(
    children.map((child) => renderNode(child, context, depth + 1)),
  );
  const renderedChildren = allChildren.filter((c): c is DomifyRenderResult => c !== null);

  if (renderedChildren.length === 0) {
    return {
      html: `${indent(depth)}<${tagName}${attrs}></${tagName}>`,
      metadata,
    };
  }

  return {
    html: `${indent(depth)}<${tagName}${attrs}>\n${renderedChildren.map((c) => c.html).join('\n')}\n${indent(depth)}</${tagName}>`,
    metadata: {
      ...metadata,
      children: renderedChildren.map((c) => c.metadata),
    },
  };
}

const SVG_SIZE_THRESHOLD = 10000;

async function renderAssetNode(node: SceneNode, context: DomifyContext, depth: number): Promise<DomifyRenderResult> {
  const className = context.classNames.get(node.id) ?? toClassName(node.name);
  const metadata = await buildMetadata(node, context.fileUrl);
  const nodeUrl = metadata.url;
  const w = 'width' in node && typeof node.width === 'number' ? Math.round(node.width) : 100;
  const h = 'height' in node && typeof node.height === 'number' ? Math.round(node.height) : 100;

  try {
    const svgString = await node.exportAsync({ format: 'SVG_STRING' });
    if (svgString.length < SVG_SIZE_THRESHOLD) {
      const attrs = toAssetAttributes(node, className, metadata.provenance, nodeUrl, 'svg');
      return {
        html: `${indent(depth)}<div${attrs}>\n${indent(depth + 1)}${svgString}\n${indent(depth)}</div>`,
        metadata,
      };
    }
  } catch { /* empty */ }

  const placeholderSrc = buildPlaceholderDataUri(node.id, nodeUrl, w, h);
  const attrs = toAssetAttributes(node, className, metadata.provenance, nodeUrl, 'image');
  const cssRule = await toCssRule(node, className);
  if (cssRule) context.cssRules.push(cssRule);
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
  assetType: 'svg' | 'image',
): string {
  const base = toAttributes(node, className, provenance, nodeUrl);
  return `${base} data-figma-asset="${assetType}"`;
}

function buildPlaceholderDataUri(nodeId: string, nodeUrl: string | null, w: number, h: number): string {
  const label = `asset:${nodeId}`;
  const linkLine = nodeUrl ? nodeUrl : nodeId;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`,
    `<rect width="100%" height="100%" fill="#E0E0E0" rx="4"/>`,
    `<text x="50%" y="45%" text-anchor="middle" font-size="10" fill="#666">${escapeXml(label)}</text>`,
    `<text x="50%" y="60%" text-anchor="middle" font-size="8" fill="#999">${escapeXml(linkLine)}</text>`,
    `</svg>`,
  ].join('');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function toCssRule(node: SceneNode, className: string): Promise<string> {
  const cssMap = await node.getCSSAsync();
  const allEntries = Object.entries(cssMap)
    .filter(([prop]) => !DOMIFY_CONFIG.ignoredProperties.includes(prop))
    .map(([prop, val]) => [prop, stripInlineComments(val)] as const);

  const negativeGap = extractNegativeGap(allEntries);
  const entries = negativeGap
    ? allEntries.filter(([prop]) => prop !== 'gap')
    : allEntries;

  const rules: string[] = [];

  if (entries.length > 0) {
    const declarations = entries.map(([prop, val]) => `  ${prop}: ${val};`).join('\n');
    rules.push(`.${className} {\n${declarations}\n}`);
  }

  if (negativeGap) {
    rules.push(toNegativeGapRule(className, negativeGap.value, allEntries));
  }

  return rules.join('\n\n');
}

function extractNegativeGap(
  entries: readonly (readonly [string, string])[],
): { value: string } | null {
  const gap = entries.find(([prop]) => prop === 'gap');
  if (!gap) return null;
  const value = gap[1];
  if (!value.startsWith('-')) return null;
  return { value };
}

function toNegativeGapRule(
  className: string,
  gapValue: string,
  entries: readonly (readonly [string, string])[],
): string {
  const direction = entries.find(([prop]) => prop === 'flex-direction');
  const isVertical = direction && direction[1] === 'column';
  const marginProp = isVertical ? 'margin-top' : 'margin-left';
  return `.${className} > * + * {\n  ${marginProp}: ${gapValue};\n}`;
}

function stripInlineComments(value: string): string {
  return value.replace(/\s*\/\*[^*]*\*\/\s*/g, ' ').trim();
}

function toAttributes(
  node: SceneNode,
  className: string,
  provenance: DomifyProvenance,
  nodeUrl: string | null,
): string {
  const attrs: string[] = [
    `class="${className}"`,
    `data-figma-node-id="${escapeHtml(node.id)}"`,
    `data-figma-node-type="${escapeHtml(node.type)}"`,
  ];

  if (nodeUrl) attrs.push(`data-figma-url="${escapeHtml(nodeUrl)}"`);
  if (provenance.componentKey) attrs.push(`data-figma-component-key="${escapeHtml(provenance.componentKey)}"`);

  if (provenance.isInstance) {
    attrs.push('data-figma-instance="true"');
    if (provenance.mainComponentId) attrs.push(`data-figma-main-component-id="${escapeHtml(provenance.mainComponentId)}"`);
    if (provenance.mainComponentKey) attrs.push(`data-figma-main-component-key="${escapeHtml(provenance.mainComponentKey)}"`);
  }

  return ` ${attrs.join(' ')}`;
}

async function buildMetadata(node: SceneNode, fileUrl: string | null): Promise<DomifyMetadataNode> {
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
  const isInstance = node.type === 'INSTANCE';
  const mainComponent = isInstance ? await node.getMainComponentAsync() : null;
  return {
    isInstance,
    mainComponentId: mainComponent ? mainComponent.id : null,
    mainComponentKey: mainComponent && typeof mainComponent.key === 'string' ? mainComponent.key : null,
    componentKey: hasOwnComponentKey(node) ? node.key : null,
  };
}

function hasOwnComponentKey(node: SceneNode): node is SceneNode & { key: string } {
  return (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') && 'key' in node && typeof node.key === 'string';
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

function collectNodeNames(node: SceneNode, names: Map<string, string>, counts: Map<string, number>): void {
  const base = toClassName(node.name);
  names.set(node.id, base);
  counts.set(base, (counts.get(base) ?? 0) + 1);
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      collectNodeNames(child, names, counts);
    }
  }
}

function extractShortId(id: string): string {
  const parts = id.split(':');
  return parts[parts.length - 1];
}

function toClassName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return sanitized.length > 0 ? sanitized : 'unnamed';
}

function getFileUrl(): string | null {
  const key = getSafeFileKey();
  if (!key) return null;
  return `https://www.figma.com/design/${key}`;
}

function toNodeUrl(fileUrl: string | null, nodeId: string): string | null {
  if (!fileUrl) return null;
  return `${fileUrl}?node-id=${nodeId.replace(/:/g, '-')}&m=dev`;
}

function getSafeFileKey(): string | null {
  try {
    return typeof figma.fileKey === 'string' && figma.fileKey.length > 0 ? figma.fileKey : null;
  } catch {
    return null;
  }
}

function indent(depth: number): string {
  return '  '.repeat(depth);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
