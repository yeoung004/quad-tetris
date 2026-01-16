# Codebase Map

이 문서는 Tetris 프로젝트의 구조, 핵심 로직, 파일별 역할을 설명하여 AI가 프로젝트를 쉽게 이해하고 컨텍스트를 파악할 수 있도록 돕습니다.

## 1. 프로젝트 구조 (Project Structure)

```
/
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── components/
    │   ├── GameBoard3D.tsx
    │   └── KeyHints.tsx
    └── engine/
        ├── TetrisBlock.ts
        ├── gameReducer.ts
        └── lineClear.ts
```

## 2. 파일 분석 (File-by-File Analysis)

### `package.json`
- **주요 역할**: 프로젝트의 의존성(dependencies)과 스크립트(scripts)를 정의합니다. `react`, `three.js`, `vite` 등을 사용하여 3D 웹 애플리케이션을 구축합니다.
- **핵심 라이브러리**: `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`, `vite`.
- **스크립트**:
    - `dev`: Vite 개발 서버를 실행합니다.
    - `build`: TypeScript 컴파일 및 Vite 프로덕션 빌드를 수행합니다.
    - `lint`: ESLint로 코드 품질을 검사합니다.

### `vite.config.ts`
- **주요 역할**: Vite 빌드 도구의 설정을 담당합니다. React 플러그인을 사용하여 JSX 변환 등을 지원합니다.
- **의존성**: `@vitejs/plugin-react`

### `src/main.tsx`
- **주요 역할**: React 애플리케이션의 진입점(entry point)입니다. `App` 컴포넌트를 `<div id="root">`에 렌더링합니다.
- **핵심 함수/상태**: `ReactDOM.createRoot`, `render`.
- **의존성**: `react`, `react-dom`, `App.tsx`.

### `src/App.tsx`
- **주요 역할**: 애플리케이션의 최상위 컴포넌트로, 게임의 "엔진" 역할을 수행합니다. 모든 상태 관리, 게임 루프, 사용자 입력을 총괄합니다.
- **핵심 함수/상태**:
    - `useReducer(gameReducer, ...)`: `gameReducer`를 사용하여 중앙 게임 상태(`gameState`)를 관리합니다.
    - `useEffect` (Game Loop): `setInterval`을 사용하여 주기적으로 블록을 아래로 이동시키는 `MOVE_BLOCK` 액션을 디스패치합니다. 이 주기는 `gameState.level`에 따라 동적으로 변경됩니다.
    - `useEffect` (Lock Delay): `gameState.isLocking` 상태를 감지하여 500ms의 락 딜레이를 구현합니다. 딜레이가 완료되면 `PLACE_BLOCK` 액션을 디스패치합니다.
    - `useEffect` (Keyboard Controls): `window.addEventListener`를 통해 키보드 입력을 받아 `MOVE_BLOCK`, `ROTATE_BLOCK`, `CHANGE_FACE` 등 다양한 액션을 디스패치합니다.
- **의존성**: `react`, `GameBoard3D.tsx`, `gameReducer.ts`.

### `src/engine/gameReducer.ts`
- **주요 역할**: 게임의 모든 순수 로직을 처리하는 Reducer 함수를 포함합니다. 상태 변경은 오직 `gameReducer`를 통해서만 이루어집니다.
- **핵심 함수/상태**:
    - `GameState` (type): 게임의 모든 상태(그리드, 현재 블록, 점수, 레벨, 게임 오버 여부 등)를 정의하는 타입. 4개의 2D 배열 `grids`가 3D 큐브의 4개 면을 나타냅니다.
    - `GameAction` (type): 가능한 모든 액션(`MOVE_BLOCK`, `ROTATE_BLOCK`, `PLACE_BLOCK` 등)의 타입을 정의합니다.
    - `gameReducer(state, action)`: `action.type`에 따라 상태를 변경하고 새로운 상태를 반환합니다.
    - `placeBlock(state)`: 현재 블록을 그리드에 고정시키고, 다음 블록을 생성하며, 라인 클리어 검사를 호출합니다.
    - `isValidMove(...)`: 블록이 주어진 위치로 이동할 수 있는지 충돌을 검사합니다.
- **의존성**: `TetrisBlock.ts`, `lineClear.ts`.

### `src/engine/TetrisBlock.ts`
- **주요 역할**: 테트리스 블록(테트로미노)의 데이터 구조와 동작을 정의합니다.
- **핵심 함수/상태**:
    - `TETROMINOS` (constant): I, J, L, O, S, T, Z 각 블록의 형태(shape)와 색상(color)을 정의한 객체입니다.
    - `TetrisBlock` (class): 블록의 타입, 모양, 색상, 위치(`position`)를 관리하며, `rotate()` 메서드를 통해 블록을 90도 회전시키는 로직을 포함합니다.
- **의존성**: 없음.

### `src/engine/lineClear.ts`
- **주요 역할**: 블록이 놓였을 때 라인이 완성되었는지 검사하고 처리하는 로직을 담당합니다.
- **핵심 함수/상태**:
    - `checkMultiFaceLineClear(gameState)`: 4개의 그리드(`grids`) 모두에서 특정 라인(`y`좌표)이 꽉 찼는지 검사합니다.
    - 라인이 완성되면 해당 라인을 제거하고, 위의 블록들을 아래로 내립니다.
    - 점수(`score`), 총 라인 수(`linesCleared`), 레벨(`level`)을 계산하여 게임 상태를 업데이트합니다.
- **의존성**: `gameReducer.ts` (GameState 타입).

### `src/components/GameBoard3D.tsx`
- **주요 역할**: `three.js`와 `@react-three/fiber`를 사용하여 게임의 3D 렌더링을 담당합니다. 게임 보드, 블록, 고스트 블록, UI 요소 등을 시각적으로 표현합니다.
- **핵심 함수/상태**:
    - `GameScene`: 주된 3D 씬을 구성하며, 카메라의 움직임, 블록 그룹의 회전을 `useFrame` 훅으로 처리합니다.
    - `GameBoardFace`: 4개의 그리드 중 하나를 받아 3D 공간에 렌더링합니다.
    - `TetrisBlock3D`, `GhostBlock3D`: 각각 현재 블록과 고스트 블록을 렌더링합니다.
    - `LevelUpOverlay`, `GameOverOverlay`: 레벨 업, 게임 오버 시 나타나는 UI 오버레이를 렌더링합니다.
    - `useEffect` (Level Up Flash): `gameState.level`의 변화를 감지하여 레벨 업 시 잠시 동안 시각 효과를 보여줍니다.
- **의존성**: `react`, `three`, `@react-three/fiber`, `@react-three/drei`, `gameReducer.ts`, `TetrisBlock.ts`.

### `src/components/KeyHints.tsx`
- **주요 역할**: 화면에 표시되는 키 조작 가이드를 렌더링하는 UI 컴포넌트입니다.
- **핵심 함수/상태**: 데스크톱과 모바일 환경에 따라 다른 조작법을 보여줍니다.
- **의존성**: `react`.

## 3. 핵심 로직 흐름 (Core Logic Flow)

이 게임의 핵심은 **4개의 2D 그리드를 이용한 3D 큐브 테트리스**입니다.

1.  **상태 관리 (`gameReducer.ts`)**: `GameState`에 `grids: (string | number)[][][]`라는 4개의 2D 배열이 있어 큐브의 4개 면을 나타냅니다. `activeFace`는 현재 플레이어가 조작 중인 면의 인덱스(0-3)를 가리킵니다.

2.  **사용자 입력 (`App.tsx`)**: 사용자가 키보드로 'q' 또는 'e'를 누르면 `CHANGE_FACE` 액션이 디스패치됩니다.

3.  **면 전환 (`gameReducer.ts`)**: `gameReducer`는 `CHANGE_FACE` 액션을 받아 `activeFace` 상태를 변경합니다.

4.  **3D 렌더링 (`GameBoard3D.tsx`)**:
    - `GameScene` 컴포넌트는 `useFrame` 훅을 사용하여 매 프레임마다 카메라의 각도와 위치를 `activeFace`에 맞춰 부드럽게 회전시킵니다.
    - `currentBlockGroupRef`도 함께 회전하여, 플레이어가 보는 면이 항상 정면을 향하도록 합니다.
    - 4개의 `GameBoardFace` 컴포넌트는 각각의 그리드 데이터를 받아 3D 공간의 해당 면에 이미 쌓인 블록들을 렌더링합니다.

5.  **블록 동기화**:
    - **활동 블록**: 현재 조작 중인 블록(`currentBlock`)은 `activeFace`에 해당하는 그리드에 대해서만 `isValidMove` 충돌 검사를 수행합니다. 렌더링 시에는 `currentBlockGroupRef`의 회전에 따라 올바른 면에 그려집니다.
    - **라인 클리어**: `checkMultiFaceLineClear` 함수는 4개 그리드 모두에서 동일한 `y` 인덱스의 라인이 꽉 찼을 때만 라인을 제거합니다. 이는 4개의 면이 동시에 클리어되어야 함을 의미하며, 3D 큐브의 "한 바퀴"가 완성되었을 때 라인이 사라지는 핵심 게임 플레이를 구현합니다.

이러한 구조를 통해 2D 배열 4개로 3D 테트리스의 복잡한 로직을 효율적으로 관리하고 렌더링합니다.
