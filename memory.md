# DOMify — Figma Codegen Plugin

## 목적

Figma MCP를 통해 AI에게 직접 작업을 시키면 실제 Figma의 스타일 값이 정확하게 반영되지 않는 문제가 있다. 이 플러그인은 Figma frame 계층을 HTML DOM 구조로, 스타일은 CSS stylesheet로 변환해서 정확한 참조물을 만든다. 이 결과를 그대로 활용하거나, AI에게 전달해서 Vue/React 코드를 생성하게 하면 Figma MCP 한 번에 하는 것보다 더 정교한 결과를 기대할 수 있다.

## 플러그인 모드

- **Code Generator** (codegen) 방식 선택
- Dev Mode에서 frame을 선택하면 우측 Inspect/Code 패널에 결과가 자동 표시
- 별도의 "실행" 버튼이 아니라 선택에 반응하는 방식

## 현재 구현 상태 (MVP)

### 출력 구조

3개 섹션으로 codegen 패널에 출력:

1. **HTML** — div/span 기반 DOM 구조, 검증용 data-attribute 포함
2. **CSS** — `getCSSAsync()`로 Figma Inspect 패널과 동일한 CSS를 그대로 가져옴
3. **Metadata** — JSON 형태의 검증용 메타데이터 (노드 트리, URL, warnings 등)

### 핵심 설계 결정

#### CSS 생성
- 수동 매핑 대신 `node.getCSSAsync()` 사용 — Figma가 Inspect 패널에 보여주는 CSS를 그대로 반환
- `DOMIFY_CONFIG.ignoredProperties` 배열로 불필요한 속성 필터링 (현재: `font-feature-settings`, `font-family`)
- 인라인 주석 자동 제거 (`line-height: 150% /* 24px */` → `line-height: 150%`)
- 음수 gap 자동 변환: `gap: -4px` → `> * + * { margin-left: -4px }` (flex-direction에 따라 margin-left 또는 margin-top)

#### HTML 태그
- TEXT 노드 → `<span>`, 나머지 → `<div>`
- 시맨틱 태그 추론은 하지 않음 (AI가 맥락을 보고 변환하는 게 더 나음)

#### Asset 처리 (SVG/이미지)
- `node.isAsset === true`이면 자식을 순회하지 않고 노드 전체를 하나의 요소로 처리
- SVG/아이콘 (10KB 미만): `exportAsync({ format: 'SVG_STRING' })` → inline SVG 그대로 출력, `data-figma-asset="svg"`
- 래스터 이미지 (10KB 이상 또는 export 실패): placeholder `<img>` 출력, `data-figma-asset="image"`
  - 회색 배경 placeholder SVG data URI
  - 1행: `asset:{nodeId}`, 2행: Figma URL (있으면)
  - `alt="asset:{nodeId}"` 로 식별 가능

#### 검증용 data-attribute
- `data-figma-node-id` — Figma Plugin API의 node.id (예: `5018:7965`)
- `data-figma-node-type` — 노드 타입 (FRAME, TEXT, INSTANCE 등)
- `data-figma-url` — 가능할 때 전체 Figma URL 생성 (fileKey 접근 가능 시)
- `data-figma-instance="true"` — INSTANCE 노드 표시
- `data-figma-main-component-id` / `data-figma-main-component-key` — 원본 컴포넌트 추적
- `data-figma-component-key` — COMPONENT/COMPONENT_SET의 key
- `data-figma-asset="svg"` / `data-figma-asset="image"` — asset 노드 구분

#### URL 생성
- `figma.fileKey`를 best-effort로 가져와서 전체 URL 생성
- 일반 플러그인에서는 fileKey 접근이 제한될 수 있음 → 실패 시 URL은 null
- URL 형식: `https://www.figma.com/design/{fileKey}?node-id={id-with-dashes}&m=dev`

#### 클래스 네이밍
- Figma 프레임 이름 기반 kebab-case (예: `Title container` → `title-container`)
- 이름 중복 시 짧은 ID 접미사 추가 (예: `tag--7996`)
- 빌드 시 전체 트리를 먼저 순회해서 중복 감지

#### 숨김 노드 처리
- `visible === false`인 노드는 자식 포함 통째로 출력에서 제외
- 루트 노드가 숨겨진 경우 안내 메시지 반환

#### Component Instance 처리
- `node.type === 'INSTANCE'` 감지
- `getMainComponentAsync()`로 비동기 접근 (deprecated 동기 API 사용하지 않음)
- main component의 id, key를 data-attribute와 metadata에 보존

### 설정 객체 (`DOMIFY_CONFIG`)

파일 최상단에 위치. 출력 커스터마이징 용도:

```typescript
const DOMIFY_CONFIG = {
  ignoredProperties: [       // getCSSAsync 결과에서 제거할 CSS 속성
    'font-feature-settings',
    'font-family',
  ],
};
```

### 파일 구조

```
manifest.json       — codegen capability, dev mode, language: "DOMify HTML/CSS/Metadata"
code.ts             — 전체 플러그인 로직 (단일 파일, ~340줄)
code.js             — TypeScript 빌드 결과 (Figma가 실행하는 파일)
tsconfig.json       — target: es2017 (Figma sandbox 호환)
eslint.config.js    — Figma plugin lint + type-checked rules
package.json        — @figma/plugin-typings, eslint 등
memory.md           — 이 파일. 세션 간 컨텍스트 보존용
```

### 빌드

```bash
npm run build    # tsc -p tsconfig.json
npm run lint     # eslint .
```

### 주의사항

- `tsconfig.json`의 target은 **es2017** — Figma sandbox가 `??` (nullish coalescing, ES2020)을 지원하지 않음
- codegen 콜백은 **15초 타임아웃** 있음
- `figma.fileKey`는 private 플러그인에서만 안정적으로 접근 가능
- `getCSSAsync()`는 브라우저 비호환 값을 반환할 수 있음 (예: `gap: -4px`) → 자동 변환 로직으로 대응

## MCP 설정 (OpenCode 환경)

- Figma remote MCP (`https://mcp.figma.com/mcp`)는 OpenCode에서 OAuth 403 → 현재 사용 불가
- Figma desktop MCP (`http://127.0.0.1:3845/sse`)를 `type: "remote"`로 설정해서 사용 중
- 설정 파일: `/Users/cheo/dotfiles/opencode/opencode.json`

## 검증용 Figma 링크

- `https://www.figma.com/design/iaeWKVf2BnGrIdIR54lbra/PRGMS---Courses---Project?node-id=5018-7965&m=dev`
- 루트 프레임 이름: `list`
- 이 프레임으로 플러그인 출력을 검증함

## 미구현 / 후순위

- character-level text override
- complex constraints (CENTER, SCALE)
- variant/override 해석
- 시맨틱 HTML 추론
- 모듈 분리 (현재 단일 파일, 번들러 없음)
