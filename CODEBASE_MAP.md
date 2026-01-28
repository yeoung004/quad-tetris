# Codebase Map (Jotai Atomic State)

이 문서는 Tetris 프로젝트의 구조, 핵심 로직, 파일별 역할을 설명하여 AI가 프로젝트를 쉽게 이해하고 컨텍스트를 파악할 수 있도록 돕습니다. 이 버전은 **Jotai**를 사용한 아토믹 상태 관리 아키텍처를 반영합니다.

## 1. 프로젝트 구조 (Project Structure)

`└── StartScreen.tsx
/
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── robots.txt
│   └── sitemap.xml
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── types.ts
    ├── atoms/
    │   └── gameAtoms.ts
    ├── components/
    │   ├── DesktopDashboard.css
    │   ├── DesktopDashboard.tsx
    │   ├── GameBoard3D.tsx
    │   ├── GameController.tsx
    │   ├── InstructionOverlay.css
    │   ├── InstructionOverlay.tsx
    │   ├── KeyHints.tsx
    │   ├── MobileControls.tsx
    │   ├── MobileHUD.tsx
    │   ├── MobileSettingsHUD.css
    │   ├── MobileSettingsHUD.tsx
    │   ├── MobileUI.css
    │   ├── NextBlockPreview.tsx
    │   ├── StartScreen.tsx
    │   └── GameOverUI.tsx
    └── hooks/
        ├── useGameActions.ts
        ├── useWindowSize.ts
        ├── useIsMobile.ts
        └── useDynamicTitle.ts
`

## 2. 파일 분석 (File-by-File Analysis)

### `package.json`
- **주요 역할**: 프로젝트 의존성을 정의합니다. `jotai`가 상태 관리를 위해 추가되었습니다.
- **핵심 라이브러리**: `react`, `jotai`, `three`, `@react-three/fiber`.

### `public/robots.txt` (New: SEO)
- **Role**: Instructs web crawlers on which pages or files the crawler can or can't request from your site.
- **Key Logic**: Allows all user agents to crawl the entire site. Points to the `sitemap.xml`.

### `public/sitemap.xml` (New: SEO)
- **Role**: Lists the important pages on the website, making it easier for search engines to find and crawl them.
- **Key Logic**: Contains a single URL entry for the main page of the application.

### `src/utils/analytics.ts` (New: Google Analytics 4 Utility)
- **주요 역할**: Google Analytics 4 (GA4) 이벤트를 추적하기 위한 유틸리티 함수들을 포함합니다.
- **핵심 로직**:
    - `initializeGA()`: `VITE_GA_MEASUREMENT_ID` 환경 변수를 사용하여 GA4를 초기화합니다. 프로덕션 환경에서만 초기화되도록 설정되어 있습니다.
    - `trackPageView(path)`: 특정 경로에 대한 페이지 뷰를 GA4로 전송합니다.
    - `trackEvent(name, params)`: 사용자 정의 이벤트를 GA4로 전송합니다.
- **의존성**: `react-ga4`.
- **환경 변수**: `VITE_GA_MEASUREMENT_ID` (GA4 측정 ID).

### `src/main.tsx`
- **주요 역할**: React 애플리케이션의 진입점.
- **핵심 변경 사항**: `initializeGA()` 함수를 호출하여 애플리케이션 로드 시 GA4를 초기화합니다.

### `index.html` (Updated: SEO and Metadata)
- **Role**: Main HTML skeleton and global settings.
- **Key Logic (Additions/Modifications)**:
    - **SEO**:
        - Optimized `<title>` with keywords.
        - Added `<meta name="description">`.
        - Implemented Open Graph (OG) tags for social media sharing.
        - Added Twitter Card tags.
        - Linked `apple-touch-icon`.
    - **Structured Data**:
        - Added a `<script type="application/ld+json">` block with "VideoGame" schema for rich search results.
    - **Touch Behavior**:
        - Globally disables touch actions like scrolling, zooming, and text selection for a better game experience on mobile.

### `src/App.tsx` (Updated: Dynamic Title)
- **Role**: The top-level component of the application. It conditionally renders `StartScreen`, `GameOverUI`, or the main game components based on the game state.
- **Key Logic**:
    - Uses the new `useDynamicTitle` hook to update the document title based on the game state (e.g., showing the score on the game over screen).
    - Renders `StartScreen` when the game hasn't started.
    - Renders `GameOverUI` when the game is over.
    - Renders the main game components when the game is active.
- **Dependencies**: `jotai`, `StartScreen`, `GameOverUI`, `useDynamicTitle`.

### `src/atoms/gameAtoms.ts` (Updated: Game State Initialization)
- **주요 역할**: 게임의 모든 상태와 관련 액션을 원자(atom) 단위로 정의합니다. 상태와 로직이 한 곳에 모여있습니다.
- **핵심 atom**:
    - **Primitive Atoms**: `gridsAtom`, `currentBlockAtom`, `scoreAtom`, `isGameStartedAtom`, `isGameOverAtom`, `isHudOpenAtom`, `isFastDroppingAtom`, `isFocusModeAtom`, `showGhostAtom` 등.
    - **Derived Atoms**: `currentGridAtom` 같이 다른 atom을 조합하여 만드는 읽기 전용 파생 상태.
    - **Writable Action Atoms**: `startGameAtom`, `moveBlockAtom`, `rotateBlockAtom`, `changeFaceAtom`, `toggleFocusModeAtom`, `toggleGhostAtom` 등.
- **주요 변경 사항**: `startGameAtom`이 호출될 때 `isGameStartedAtom`을 `true`로 설정하고 `isGameOverAtom`을 `false`로 명시적으로 초기화하여 게임 시작/재시작 시 상태 일관성을 보장합니다.
- **의존성**: `jotai`.

### `src/hooks/useDynamicTitle.ts` (New: SEO)
- **Role**: A new custom hook to dynamically update the document's title for SEO and user experience.
- **Key Logic**: Subscribes to `scoreAtom` and `isGameOverAtom`. When `isGameOver` becomes `true`, it updates the title to "Game Over - Score: [score] | Quad-Tetris". Otherwise, it keeps the default optimized title.
- **Usage**: Called once in `App.tsx` to manage the title for the entire application lifecycle.

### `src/hooks/useWindowSize.ts`
- **주요 역할**: 브라우저 창의 크기가 변경될 때마다 현재 너비와 높이를 반환하는 커스텀 훅입니다.
- **핵심 로직**: `resize` 이벤트 리스너를 사용하여 창 크기를 상태로 관리합니다.
- **사용처**: `DesktopDashboard`, `MobileHUD`, `MobileControls`, `MobileSettingsHUD`, `InstructionOverlay`, `useIsMobile` 에서 화면 크기에 따라 UI를 조건부로 렌더링하는 데 사용됩니다.

### `src/hooks/useIsMobile.ts` (New: Mobile Device Detection)
- **주요 역할**: `useWindowSize` 훅을 기반으로 현재 장치가 모바일인지 여부를 감지하는 새로운 커스텀 훅입니다.
- **핵심 로직**: `useWindowSize`에서 얻은 `width`를 사용하여 특정 브레이크포인트(예: `< 768px`) 미만일 경우 `isMobile`을 `true`로 반환합니다.
- **사용처**: `StartScreen`, `GameOverUI` 등에서 장치별 UI 메시징을 위해 사용됩니다.

### `src/hooks/useGameActions.ts`
- **주요 역할**: 모바일 터치 입력을 처리하는 커스텀 훅입니다. 탭, 롱 프레스, 스와이프 제스처를 구분하여 게임 액션을 트리거합니다.
- **핵심 로직**:
    - `onTouchStart`와 `onTouchEnd` 이벤트에 `e.preventDefault()`를 사용하여 브라우저 기본 동작(스크롤, 확대)을 비활성화합니다. 전역 `e.preventDefault()`가 추가되었지만, 이 컴포넌트의 명시적 호출은 로직의 견고성을 유지합니다.
    - 짧은 탭은 블록 회전(`rotateBlock`)을 실행합니다.
    - 200ms 이상 길게 누르면 "Fast Drop" 모드(`isFastDroppingAtom`)를 활성화합니다.
    - 스와이프는 블록을 좌우로 이동(`moveBlock`)하거나 아래로 드롭(`dropBlock`)시킵니다.
    - 롱 프레스나 스와이프 중에는 회전이 방지됩니다.
- **사용처**: `GameBoard3D.tsx`.

### `src/components/GameController.tsx`
- **주요 역할**: 게임의 "엔진" 역할을 수행하는 보이지 않는(non-rendering) 컴포넌트입니다. 게임 루프, 키보드 입력, 락 딜레이 등 모든 사이드 이펙트를 처리합니다.
- **핵심 로직**:
    - `useSetAtom`으로 `moveBlockAtom`, `changeFaceAtom` 등 액션 atom들의 setter 함수를 가져옵니다.
    - `useEffect`를 사용하여 키보드 입력을 감지하고 게임 루프를 실행합니다.
    - **`isFastDroppingAtom` 상태를 구독하여 `true`일 경우 게임 루프의 속도를 높여 블록을 빠르게 내립니다.**
- **의존성**: `react`, `jotai`, `gameAtoms.ts`.

### `src/components/GameBoard3D.tsx` (Updated: Absolute Touch Suppression)
- **주요 역할**: `three.js`를 사용하여 게임의 3D 렌더링을 담당하고, 모바일 입력을 처리합니다.
- **핵심 로직 (추가/수정)**:
    - `@react-three/fiber`의 `Canvas`를 설정하고, 3D 씬을 구성합니다.
    - 최상위 `div`에 `touch-action: none !important`, `user-select: none`, `-webkit-touch-callout: none` 스타일을 적용하여 모바일 드래그, 선택 및 컨텍스트 메뉴를 방지합니다.
    - `useGameActions` 훅을 사용하여 터치 이벤트를 처리하고, 해당 핸들러(`handleTouchStart`, `handleTouchEnd`)를 최상위 `div`에 바인딩합니다.
- **의존성**: `react`, `jotai`, `@react-three/fiber`, `gameAtoms.ts`, `useGameActions.ts`.

### `src/components/MobileControls.tsx`
- **주요 역할**: 모바일 전용의 화면 좌우 터치 영역을 제공하여 큐브의 면(face)을 회전시킵니다.
- **핵심 로직**:
    - `useWindowSize` 훅을 사용하여 데스크탑 뷰포트에서는 렌더링되지 않습니다.
    - `changeFaceAtom`을 호출하여 큐브 면 변경을 트리거합니다.
    - **이제 화면 좌우에 반투명 네온 스타일의 세로 막대로 표시되어 사용자가 명확히 인지할 수 있습니다. 각 막대에는 '<', '>' 아이콘이 포함되어 있으며, 탭하면 빛나는 효과가 나타납니다.**
    - 터치/클릭 이벤트에 300ms의 디바운스를 적용하여 한 번의 탭으로 여러 번의 액션이 발생하는 것을 방지합니다.
- **의존성**: `react`, `jotai`, `gameAtoms.ts`, `useWindowSize.ts`.

### `src/components/InstructionOverlay.tsx`
- **주요 역할**: 게임 방법, 조작법, 승리 조건을 설명하는 오버레이 컴포넌트입니다.
- **핵심 로직**:
    - `StartScreen`에 있는 '?' 버튼을 통해 활성화됩니다.
    - `useWindowSize` 훅을 사용하여 모바일와 데스크탑에 각기 다른 레이아웃을 보여줍니다. (모바일: 세로 스크롤, 데스크탑: 고정 대시보드)
    - 부드러운 fade-in 효과를 위한 CSS 애니메이션을 포함합니다.
- **의존성**: `react`, `useWindowSize.ts`.

### `src/components/MobileSettingsHUD.tsx`
- **주요 역할**: **모바일 전용**으로, 화면 좌측 상단에 설정(톱니바퀴) 아이콘을 표시합니다.
- **핵심 로직**:
    - `useWindowSize` 훅을 사용하여 데스크탑 뷰포트에서는 렌더링되지 않습니다.
    - 설정 아이콘을 탭하면 **Focus Mode**와 **Ghost Mode**를 켜고 끌 수 있는 메뉴가 나타납니다.
    - `toggleFocusModeAtom`과 `toggleGhostAtom`을 호출하여 관련 게임 상태를 변경합니다.
    - `safe-area-inset`과 `dvh` 단위를 고려한 CSS로 모바일 화면에 안전하게 배치됩니다.
- **의존성**: `react`, `jotai`, `gameAtoms.ts`, `useWindowSize.ts`.

### `src/components/MobileHUD.tsx`
- **주요 역할**: **모바일 전용**으로, 게임 정보(점수, 레벨 등)를 표시하는 HUD입니다.
- **핵심 로직**:
    - `useWindowSize` 훅을 사용하여 데스크탑 뷰포트에서는 렌더링되지 않습니다.
    - **'i' 버튼을 누르고 있는 동안에만(`press-and-hold`) `NextBlockPreview`를 포함한 추가 정보를 표시합니다.**
    - `isGameStarted`가 `false`이면 렌더링되지 않아 `StartScreen`과의 상호작용 충돌을 방지합니다.
- **의존성**: `react`, `jotai`, `gameAtoms.ts`, `NextBlockPreview.tsx`, `useWindowSize.ts`.

### `src/components/DesktopDashboard.tsx`
- **주요 역할**: **데스크탑 전용**으로, 게임 정보, 다음 블록, 조작법을 항상 표시하는 영구적인 대시보드입니다.
- **핵심 로직**:
    - `useWindowSize` 훅을 사용하여 모바일 뷰포트에서는 렌더링되지 않습니다.
    - 화면 좌우에 패널을 배치하여 게임 정보를 표시합니다.
- **의존성**: `react`, `jotai`, `gameAtoms.ts`, `NextBlockPreview.tsx`, `KeyHints.tsx`, `useWindowSize.ts`.

### `src/components/NextBlockPreview.tsx`
- **주요 역할**: 다음 테트리스 블록을 3D로 렌더링하는 재사용 가능한 컴포넌트입니다.
- **사용처**: `MobileHUD`와 `DesktopDashboard`에서 모두 사용됩니다.
- **의존성**: `react`, `jotai`, `@react-three/fiber`, `gameAtoms.ts`.

### `src/components/StartScreen.tsx` (Updated: Accessibility)
- **Role**: Displays the game start screen.
- **Key Logic**:
    - Calls `startGameAtom` to start or restart the game.
    - Uses `useIsMobile` hook for device-specific messaging.
    - **Accessibility**: Added `role="button"` and `aria-label` to the main container and help button for screen reader support.
- **Dependencies**: `jotai`, `useIsMobile`, `InstructionOverlay`.

### `src/components/GameOverUI.tsx` (Updated: Accessibility)
- **Role**: Displays the "GAME OVER" message and restart option.
- **Key Logic**:
    - Receives an `onRestart` prop to trigger the restart logic.
    - Uses `useIsMobile` for device-specific messaging.
    - **Accessibility**: Added `role="button"` and `aria-label="Restart Game"` for screen reader support.
    - Conditionally rendered in `App.tsx` based on the `isGameOver` state.
- **Dependencies**: `useIsMobile`.


### `src/engine/grid.ts`
- **주요 역할**: 그리드 생성, 충돌 검사 등 상태와 무관한 순수 함수들을 포함하는 유틸리티 파일입니다.

## 3. 핵심 로직 흐름 (Data Flow with Jotai)

Jotai 아키텍처는 분산된 atom들의 네트워크를 통해 상태를 관리합니다. UI는 반응형으로 설계되었습니다.

1.  **상태 정의 (`gameAtoms.ts`)**: 게임의 모든 상태(`grids`, `score`, `isFastDroppingAtom`, `isFocusModeAtom`, `showGhostAtom` 등)가 독립적인 `atom`으로 존재합니다. 이제 `isGameOverAtom`이 게임 종료 상태를 관리하며, `startGameAtom`은 게임 시작 및 재시작 시 상태를 올바르게 초기화합니다.

2.  **UI 렌더링 (Responsive)**:
    - `useWindowSize` 훅이 화면 크기를 감지합니다.
    - 데스크탑 크기(`>=1024px`)에서는 `DesktopDashboard`가 렌더링되어 영구적인 정보 패널을 보여줍니다. `MobileHUD`, `MobileControls`, `MobileSettingsHUD`는 숨겨집니다.
    - 모바일 크기(`<1024px`)에서는 `MobileHUD`('i' 버튼을 누르는 동안 정보 표시), `MobileControls`(좌우 터치 영역), `MobileSettingsHUD`(설정 메뉴)가 렌더링됩니다. `DesktopDashboard`는 숨겨집니다.
    - `App.tsx`는 `isGameStarted`와 `isGameOver` 상태에 따라 `StartScreen`, `GameOverUI`, 또는 실제 게임 UI를 조건부로 렌더링합니다.

3.  **액션 실행 (`GameController`, `useGameActions` 등)**:
    - **키보드 입력 (`GameController`)**: `keydown` 이벤트에 따라 `moveBlockAtom`, `rotateBlockAtom` 등의 atom을 직접 호출합니다.
    - **터치 입력 (`GameBoard3D` -> `useGameActions`)**: `GameBoard3D`의 터치 이벤트는 `useGameActions` 훅으로 위임됩니다. 이 훅은 제스처(탭, 롱 프레스, 스와이프)를 분석하여 `moveBlockAtom`, `rotateBlockAtom`, `isFastDroppingAtom` 등의 상태를 업데이트합니다.
    - `MobileControls`는 `changeFaceAtom`을 호출하여 뷰를 회전시킵니다.
    - `MobileSettingsHUD`는 `toggleFocusModeAtom`과 `toggleGhostAtom`을 호출하여 게임 설정을 변경합니다.
    - `StartScreen`과 `GameOverUI`는 사용자의 입력에 따라 `startGameAtom`을 호출하여 게임을 시작하거나 재시작합니다.

4.  **상태 전파 및 리렌더링**:
    - `scoreAtom`의 상태가 변경되면, 이 atom을 구독하는 `DesktopDashboard` 또는 `MobileHUD` 컴포넌트의 점수 표시 부분만 리렌더링됩니다.
    - `isFastDroppingAtom`이 `true`가 되면 `GameController`의 게임 루프가 더 빠른 속도로 재시작됩니다.
    - `isGameStartedAtom` 또는 `isGameOverAtom`의 변경은 `App.tsx`의 최상위 조건부 렌더링에 영향을 미쳐 `StartScreen`, `GameOverUI`, 또는 게임 화면으로 전환되도록 합니다.
    - `useDynamicTitle` hook ensures the document title updates automatically when `isGameOver` or `score` changes.
    - 상태 변경이 발생한 atom을 구독하는 컴포넌트만 정확히 리렌더링되므로, 불필요한 렌더링이 최소화됩니다.