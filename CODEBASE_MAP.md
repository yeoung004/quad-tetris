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
    - **Primitive Atoms**: `gridsAtom`, `currentBlockAtom`, `scoreAtom`, `isFocusModeAtom` 등 독립적인 상태 조각들.
    - **Derived Atoms**: `currentGridAtom` 같이 다른 atom을 조합하여 만드는 읽기 전용 파생 상태.
    - **Writable Action Atoms**: `startGameAtom`, `moveBlockAtom`, `placeBlockAtom`, `toggleFocusModeAtom` 등 게임 로직을 실행하는 쓰기 전용 atom. `get`과 `set`을 사용하여 원자적으로 다른 atom들을 업데이트합니다.
- **의존성**: `jotai`.

### `src/components/GameController.tsx`
- **주요 역할**: 게임의 "엔진" 역할을 수행하는 보이지 않는(non-rendering) 컴포넌트입니다. 게임 루프, 키보드 입력, 락 딜레이 등 모든 사이드 이펙트를 처리합니다.
- **핵심 로직**:
    - `useSetAtom`으로 `moveBlockAtom`, `placeBlockAtom` 등 액션 atom들의 setter 함수를 가져옵니다.
    - `useEffect` (Game Loop / Keyboard): 상태에 따라 적절한 액션 atom을 실행합니다. 'f' 키 입력을 감지하여 `toggleFocusModeAtom`을 호출, 포커스 모드를 토글합니다.
    - `useAtomValue`로 `isGameOver`, `level` 등의 상태를 구독하여 로직에 사용합니다.
- **의존성**: `react`, `jotai`, `gameAtoms.ts`.

### `src/components/GameBoard3D.tsx`
- **주요 역할**: `three.js`를 사용하여 게임의 3D 렌더링을 담당합니다.
- **핵심 로직**:
    - `gameState`와 `dispatch` prop이 제거되고, `useAtomValue`를 사용하여 `gridsAtom`, `currentBlockAtom` 등 렌더링에 필요한 상태를 직접 구독합니다.
    - `isFocusModeAtom`과 `activeFaceAtom`을 구독하여 '포커스 모드'를 구현합니다.
    - **GameBoardFace**: `GameScene` 내부에 정의된 이 컴포넌트는 `isFocusMode`가 활성화되면 `activeFace`가 아닌 다른 면의 블록들을 희미하게(low opacity) 렌더링하여 사용자의 시선을 집중시킵니다.
    - **GameBoardBoundary**: 포커스 모드일 때 경계 박스의 불투명도를 높여 뒷면의 시각적 노이즈를 차단합니다.
    - `NextBlockPreview`, `GameOverOverlay` 등 하위 컴포넌트들도 atom을 직접 구독하거나 필요한 값을 prop으로 전달받습니다. 이로써 컴포넌트들이 완전히 분리되고 재사용성이 높아집니다.
- **의존성**: `react`, `jotai`, `@react-three/fiber`, `gameAtoms.ts`.

### `src/engine/grid.ts`
- **주요 역할**: 기존 `gameReducer.ts`에서 순수 로직 부분만 분리한 유틸리티 파일입니다. 그리드 생성, 충돌 검사 등 상태와 무관한 함수들을 포함합니다.
- **핵심 함수**: `createEmptyGrid()`, `isValidMove()`.
- **의존성**: `TetrisBlock.ts`.

## 3. 핵심 로직 흐름 (New Data Flow with Jotai)

Jotai 아키텍처는 `useReducer`와 달리 중앙 집중식 스토어가 아닌, 분산된 atom들의 네트워크를 통해 상태를 관리합니다.

1.  **상태 정의 (`gameAtoms.ts`)**: 게임의 모든 상태(`grids`, `score` 등)가 독립적인 `atom`으로 존재합니다.

2.  **사용자 입력 (`GameController.tsx`)**: 사용자가 키보드를 누르면 `GameController`의 `useEffect`가 이를 감지하고 `useGameActions`에서 가져온 특정 액션 함수(예: `moveBlock(-1, 0)`)를 호출합니다.

3.  **액션 실행 (`useGameActions.ts`)**:
    - `moveBlock` 함수가 호출되면, 내부에서 `setGameState(prev => ...)`를 사용하여 관련 atom들의 상태를 원자적으로(atomically) 업데이트합니다.
    - `isValidMove` 같은 순수 함수를 사용하여 다음 상태를 계산하고, 레이스 컨디션을 방지하기 위해 반드시 함수형 업데이트를 사용합니다.

4.  **상태 전파 및 리렌더링**:
    - `currentBlockAtom`의 상태가 변경되면, 이 atom을 `useAtomValue`로 구독하고 있는 `GameBoard3D`의 `GameScene` 컴포넌트만 리렌더링됩니다.
    - `scoreAtom`이 변경되면 `App.tsx`의 점수 표시 부분만 리렌더링됩니다.
    - **최적화**: 이처럼 상태 변경이 발생한 atom을 구독하는 컴포넌트만 정확히 리렌더링되므로, 불필요한 렌더링이 최소화됩니다.

5.  **독립적인 로직 실행**:
    - `GameController`의 하강 타이머(`setInterval`)는 `moveBlock(0, 1)`을 주기적으로 호출합니다.
    - 동시에 사용자는 `changeFace('left')`를 호출할 수 있습니다. 이 액션은 `activeFaceAtom`을 변경하며, `useFrame` 훅이 이 변경을 감지하여 카메라를 부드럽게 회전시킵니다.
    - 두 로직은 서로 다른 atom을 업데이트하므로 충돌하지 않고 독립적으로 실행될 수 있습니다. `useReducer`에서 발생할 수 있었던 복잡한 상태 병합 및 덮어쓰기 문제가 원천적으로 해결됩니다.

이 구조는 상태와 로직, 뷰를 명확히 분리하고, 각 컴포넌트가 필요한 최소한의 상태만 구독하게 하여 애플리케이션의 성능과 유지보수성을 극대화합니다.

## 4. 시각적 집중도 최적화 (Focus Mode) 데이터 흐름

'Focus Mode'는 사용자가 현재 활성화된 면에만 집중할 수 있도록 다른 면의 시각적 요소를 최소화하는 기능입니다.

1.  **사용자 입력 (`GameController.tsx`)**: 사용자가 'F' 키를 누릅니다.
2.  **액션 실행 (`gameAtoms.ts`)**: `GameController`는 `toggleFocusModeAtom` 액션을 호출합니다. 이 액션은 `isFocusModeAtom`의 boolean 상태를 토글합니다.
3.  **상태 전파 (`Jotai`)**: `isFocusModeAtom`의 상태 변경이 발생합니다.
4.  **UI 렌더링 (`GameBoard3D.tsx`)**:
    - `GameBoard3D` 내부의 `GameScene` 컴포넌트는 `isFocusModeAtom`과 `activeFaceAtom`을 구독하고 있습니다.
    - `GameScene`은 4개의 `GameBoardFace` 자식 컴포넌트를 렌더링할 때, `isFocusMode`와 `activeFace` 상태를 prop으로 전달합니다.
    - 각 `GameBoardFace`는 자신이 `activeFace`가 아니고 `isFocusMode`가 `true`이면, 내부의 `TetrisBlock3D` 컴포넌트들의 `opacity`를 매우 낮게 설정하여 렌더링합니다.
    - `GameBoardBoundary` 컴포넌트 역시 `isFocusModeAtom`을 구독하여, 포커스 모드 시 자신의 `opacity`를 높여 배경의 방해 요소를 줄입니다.

이 흐름을 통해 단일 상태(`isFocusModeAtom`)의 변경만으로 여러 3D 컴포넌트의 시각적 표현이 일관되게 변경되어 최적화된 사용자 경험을 제공합니다.
