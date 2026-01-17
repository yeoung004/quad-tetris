# Codebase Map (Jotai Atomic State)

이 문서는 Tetris 프로젝트의 구조, 핵심 로직, 파일별 역할을 설명하여 AI가 프로젝트를 쉽게 이해하고 컨텍스트를 파악할 수 있도록 돕습니다. 이 버전은 **Jotai**를 사용한 아토믹 상태 관리 아키텍처를 반영합니다.

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
    ├── atoms/
    │   └── gameAtoms.ts
    ├── components/
    │   ├── GameBoard3D.tsx
    │   ├── GameController.tsx
    │   └── KeyHints.tsx
    ├── engine/
    │   ├── TetrisBlock.ts
    │   └── grid.ts
```

## 2. 파일 분석 (File-by-File Analysis)

### `package.json`
- **주요 역할**: 프로젝트 의존성을 정의합니다. `jotai`가 상태 관리를 위해 추가되었습니다.
- **핵심 라이브러리**: `react`, `jotai`, `three`, `@react-three/fiber`.

### `src/main.tsx`
- **주요 역할**: React 애플리케이션의 진입점. `Provider`로 `App`을 감싸 Jotai 상태를 주입합니다. (수정 필요 시)

### `src/App.tsx`
- **주요 역할**: 애플리케이션의 최상위 레이아웃 컴포넌트입니다. 게임 정보 UI와 3D 보드를 렌더링합니다.
- **핵심 로직**:
    - `useAtomValue`를 사용하여 `scoreAtom`, `levelAtom` 등 필요한 상태를 구독하고 UI에 표시합니다.
    - 게임의 핵심 로직과 사이드 이펙트 처리는 `GameController` 컴포넌트에 위임합니다.
- **의존성**: `react`, `jotai`, `GameBoard3D.tsx`, `GameController.tsx`, `gameAtoms.ts`.

### `src/atoms/gameAtoms.ts`
- **주요 역할**: 게임의 모든 상태와 관련 액션을 원자(atom) 단위로 정의합니다. 상태와 로직이 한 곳에 모여있습니다.
- **핵심 atom**:
    - **Primitive Atoms**: `gridsAtom`, `currentBlockAtom`, `scoreAtom`, `isFocusModeAtom`, `isGameOverAtom`, `gameOverMessageAtom` 등 독립적인 상태 조각들.
    - **Derived Atoms**: `currentGridAtom` 같이 다른 atom을 조합하여 만드는 읽기 전용 파생 상태.
    - **Writable Action Atoms**: `startGameAtom`, `moveBlockAtom`, `placeBlockAtom`, `changeFaceAtom` 등 게임 로직을 실행하는 쓰기 전용 atom. `get`과 `set`을 사용하여 원자적으로 다른 atom들을 업데이트합니다. 특히 `changeFaceAtom`은 면 전환 시 다음 면의 그리드와 충돌 여부를 확인하여 즉시 게임 오버를 처리하는 '면 전환 사망' 로직을 포함합니다.
- **의존성**: `jotai`.

### `src/components/GameController.tsx`
- **주요 역할**: 게임의 "엔진" 역할을 수행하는 보이지 않는(non-rendering) 컴포넌트입니다. 게임 루프, 키보드 입력, 락 딜레이 등 모든 사이드 이펙트를 처리합니다.
- **핵심 로직**:
    - `useSetAtom`으로 `moveBlockAtom`, `placeBlockAtom`, `changeFaceAtom` 등 액션 atom들의 setter 함수를 가져옵니다.
    - `useEffect` (Game Loop / Keyboard): 상태에 따라 적절한 액션 atom을 실행합니다. 'f' 키 입력을 감지하여 `toggleFocusModeAtom`을 호출, 포커스 모드를 토글합니다.
    - **키보드 입력 (DAS/ARR)**: `keydown` 및 `keyup` 이벤트를 리스닝하여 `setTimeout`과 `setInterval`을 사용한 **DAS (Delayed Auto Shift)** 로직을 구현합니다. 사용자가 좌/우/아래 방향키를 길게 누르면, 짧은 지연(`DAS_DELAY`) 후 `ARR` (Auto Repeat Rate) 간격으로 `moveBlockAtom`이 연속적으로 호출되어 부드러운 블록 이동을 제공합니다. `useRef`를 사용하여 타이머 ID를 관리하고, `e.repeat` 플래그를 이용해 키의 첫 입력만 감지하여 안정적으로 타이머를 시작합니다.
    - `useAtomValue`로 `isGameOver`, `level` 등의 상태를 구독하여 로직에 사용합니다.
- **의존성**: `react`, `jotai`, `gameAtoms.ts`.

### `src/components/GameBoard3D.tsx`
- **주요 역할**: `three.js`를 사용하여 게임의 3D 렌더링을 담당합니다.
- **핵심 로직**:
    - `gameState`와 `dispatch` prop이 제거되고, `useAtomValue`를 사용하여 `gridsAtom`, `currentBlockAtom` 등 렌더링에 필요한 상태를 직접 구독합니다.
    - **GameOverOverlay**: `isGameOverAtom`이 `true`가 되면 활성화됩니다. `gameOverMessageAtom`을 구독하여 'GAME OVER' 또는 'COLLISION!'과 같이 게임 오버의 원인에 따른 맞춤 메시지를 표시합니다.
    - **Focus Mode**: `isFocusModeAtom`과 `activeFaceAtom`을 구독하여 '포커스 모드'를 구현합니다. `GameBoardFace` 컴포넌트는 `isFocusMode`가 활성화되면 `activeFace`가 아닌 다른 면의 블록들을 희미하게(low opacity) 렌더링하여 사용자의 시선을 집중시킵니다.
    - `NextBlockPreview`, `GameBoardBoundary` 등 다른 하위 컴포넌트들도 atom을 직접 구독하여 재사용성을 높입니다.
- **의존성**: `react`, `jotai`, `@react-three/fiber`, `gameAtoms.ts`.

### `src/engine/grid.ts`
- **주요 역할**: 기존 `gameReducer.ts`에서 순수 로직 부분만 분리한 유틸리티 파일입니다. 그리드 생성, 충돌 검사 등 상태와 무관한 함수들을 포함합니다.
- **핵심 함수**: `createEmptyGrid()`, `isValidMove()`.
- **의존성**: `TetrisBlock.ts`.

## 3. 핵심 로직 흐름 (New Data Flow with Jotai)

Jotai 아키텍처는 `useReducer`와 달리 중앙 집중식 스토어가 아닌, 분산된 atom들의 네트워크를 통해 상태를 관리합니다.

1.  **상태 정의 (`gameAtoms.ts`)**: 게임의 모든 상태(`grids`, `score` 등)가 독립적인 `atom`으로 존재합니다.

2.  **사용자 입력 (`GameController.tsx`)**:
    - **단일 입력**: 사용자가 키보드를 한 번 누르면(예: `ArrowUp`), `GameController`의 `keydown` 이벤트 핸들러가 이를 감지하고 `rotateBlockAtom` 같은 액션 atom을 즉시 호출합니다.
    - **연속 입력 (DAS)**: 사용자가 이동키(좌/우/아래)를 길게 누르면, `keydown` 핸들러가 첫 입력 시점에 DAS 타이머를 시작합니다. 지연 시간이 지나면 ARR 타이머가 활성화되어 `moveBlockAtom`을 주기적으로 호출, 부드러운 연속 이동을 구현합니다. 사용자가 키를 떼면 `keyup` 핸들러가 모든 관련 타이머를 즉시 해제합니다.

3.  **액션 실행 (`gameAtoms.ts`)**:
    - `moveBlockAtom`이나 `rotateBlockAtom` 같은 액션이 호출되면, 내부 로직이 `set` 함수를 사용하여 관련 상태 atom들을 원자적으로(atomically) 업데이트합니다.
    - `isValidMove` 같은 순수 함수를 사용하여 다음 상태를 계산하고, 레이스 컨디션을 방지하기 위해 항상 함수형 업데이트(`set(atom, prev => ...)`)를 사용합니다.

4.  **상태 전파 및 리렌더링**:
    - `currentBlockAtom`의 상태가 변경되면, 이 atom을 `useAtomValue`로 구독하고 있는 `GameBoard3D`의 `GameScene` 컴포넌트만 리렌더링됩니다.
    - `scoreAtom`이 변경되면 `App.tsx`의 점수 표시 부분만 리렌더링됩니다.
    - **최적화**: 이처럼 상태 변경이 발생한 atom을 구독하는 컴포넌트만 정확히 리렌더링되므로, 불필요한 렌더링이 최소화됩니다.

5.  **독립적인 로직 실행**:
    - `GameController`의 하강 타이머(`setInterval`)는 `moveBlock({ dx: 0, dy: 1 })`을 주기적으로 호출합니다.
    - 동시에 사용자는 `changeFace('left')`를 호출할 수 있습니다. 이 액션은 `activeFaceAtom`을 변경하며, 충돌 발생 시 게임 오버 처리 후 카메라 회전을 중단합니다.
    - 두 로직은 서로 다른 atom을 업데이트하므로 충돌하지 않고 독립적으로 실행될 수 있습니다. `useReducer`에서 발생할 수 있었던 복잡한 상태 병합 및 덮어쓰기 문제가 원천적으로 해결됩니다.

이 구조는 상태와 로직, 뷰를 명확히 분리하고, 각 컴포넌트가 필요한 최소한의 상태만 구독하게 하여 애플리케이션의 성능과 유지보수성을 극대화합니다.

## 4. 시각적 집중도 최적화 (Focus Mode) 데이터 흐름

'Focus Mode'는 사용자가 현재 활성화된 면에만 집중할 수 있도록 다른 면의 시각적 요소를 최소화하는 기능입니다. 이 흐름은 단일 상태(`isFocusModeAtom`)의 변경만으로 여러 3D 컴포넌트의 시각적 표현이 일관되게 변경되어 최적화된 사용자 경험을 제공합니다.

1.  **사용자 입력 (`GameController.tsx`)**: 사용자가 'F' 키를 누릅니다.
2.  **액션 실행 (`gameAtoms.ts`)**: `GameController`는 `toggleFocusModeAtom` 액션을 호출합니다.
3.  **상태 전파 (`Jotai`)**: `isFocusModeAtom`의 상태 변경이 발생합니다.
4.  **UI 렌더링 (`GameBoard3D.tsx`)**: `GameBoardFace`와 `GameBoardBoundary` 컴포넌트가 `isFocusModeAtom`의 새 값을 기반으로 투명도를 조절하여 리렌더링합니다.

## 5. UX 개선: DAS를 통한 연속 이동 로직

**DAS (Delayed Auto Shift)** 와 **ARR (Auto Repeat Rate)** 시스템은 현대 테트리스 게임의 표준 조작감을 제공하여 사용자 경험을 크게 향상시킵니다. 이 시스템은 `GameController.tsx` 내에서 `setTimeout`과 `setInterval`을 조합하여 구현되었습니다.

- **문제점**: DAS가 없으면, 사용자는 블록을 여러 칸 이동시키기 위해 방향키를 반복적으로 눌러야 합니다.
- **해결책**: 키를 길게 누르면 짧은 지연 후, 빠른 속도로 블록이 연속 이동하여 정교하고 빠른 조작을 가능하게 합니다.

## 6. 핵심 게임플레이 메커니즘 (Core Gameplay Mechanics)

### 면 전환 사망 판정 (Face-Switch Death)
- **정의**: 4면체 테트리스 고유의 게임 오버 조건입니다. 플레이어가 Q 또는 E 키로 보드의 면을 전환할 때, 현재 조작 중인 블록이 이동하려는 새로운 면에 이미 쌓여있는 블록들과 겹치면 즉시 게임이 종료됩니다.
- **로직 흐름**:
    1. **사용자 입력**: `GameController`가 Q/E 키 입력을 감지하고 `changeFaceAtom` 액션을 호출합니다.
    2. **충돌 검사 (`changeFaceAtom`)**: `activeFaceAtom`을 바로 바꾸는 대신, 목표 면의 그리드 데이터(`grids[newFace]`)와 `currentBlock`의 현재 위치를 `isValidMove()` 함수로 넘겨 충돌 여부를 먼저 확인합니다.
    3. **게임 오버 처리**: `isValidMove()`가 `false`를 반환하면, `isGameOverAtom`을 `true`로, `gameOverMessageAtom`을 "COLLISION!"으로 설정하여 게임을 즉시 종료시킵니다. 면 전환은 일어나지 않습니다.
    4. **정상 전환**: 충돌이 없으면(`true` 반환), `activeFaceAtom`의 값을 새로운 면으로 업데이트하여 카메라 회전을 시작합니다.
- **목적**: 이 메커니즘은 플레이어에게 단순히 블록을 쌓는 것뿐만 아니라, 각 4개 면의 공간을 전략적으로 관리해야 하는 새로운 차원의 도전을 제공합니다.

이 문서는 프로젝트가 발전함에 따라 지속적으로 업데이트되어야 합니다.