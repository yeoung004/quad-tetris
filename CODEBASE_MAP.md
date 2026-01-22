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
    ├── types.ts
    ├── atoms/
    │   └── gameAtoms.ts
    ├── components/
    │   ├── GameBoard3D.tsx
    │   ├── GameController.tsx
    │   ├── InfoToggle.tsx
    │   ├── KeyHints.tsx
    │   ├── MobileHUD.tsx
    │   ├── StartScreen.tsx
    │   └── MobileUI.css
    ├── engine/
    │   ├── TetrisBlock.ts
    │   └── grid.ts
    └── hooks/
```

## 2. 파일 분석 (File-by-File Analysis)

### `package.json`
- **주요 역할**: 프로젝트 의존성을 정의합니다. `jotai`가 상태 관리를 위해 추가되었습니다.
- **핵심 라이브러리**: `react`, `jotai`, `three`, `@react-three/fiber`.

### `src/main.tsx`
- **주요 역할**: React 애플리케이션의 진입점.

### `src/atoms/gameAtoms.ts`
- **주요 역할**: 게임의 모든 상태와 관련 액션을 원자(atom) 단위로 정의합니다. 상태와 로직이 한 곳에 모여있습니다.
- **핵심 atom**:
    - **Primitive Atoms**: `gridsAtom`, `currentBlockAtom`, `scoreAtom`, `isGameStartedAtom`, `isHudOpenAtom` (신규) 등.
    - **Derived Atoms**: `currentGridAtom` 같이 다른 atom을 조합하여 만드는 읽기 전용 파생 상태.
    - **Writable Action Atoms**: `startGameAtom`, `moveBlockAtom`, `rotateBlockAtom` 등.
- **의존성**: `jotai`.

### `src/components/GameController.tsx`
- **주요 역할**: 게임의 "엔진" 역할을 수행하는 보이지 않는(non-rendering) 컴포넌트입니다. 게임 루프, 키보드 입력, 락 딜레이 등 모든 사이드 이펙트를 처리합니다.
- **핵심 로직**:
    - `useSetAtom`으로 `moveBlockAtom`, `placeBlockAtom` 등 액션 atom들의 setter 함수를 가져옵니다.
    - `useEffect`를 사용하여 키보드 입력을 감지하고 게임 루프를 실행합니다.
- **의존성**: `react`, `jotai`, `gameAtoms.ts`.

### `src/components/GameBoard3D.tsx`
- **주요 역할**: `three.js`를 사용하여 게임의 3D 렌더링을 담당합니다.
- **핵심 로직**: `@react-three/fiber`의 `Canvas`를 설정하고, 3D 씬을 구성합니다.
- **의존성**: `react`, `jotai`, `@react-three/fiber`, `gameAtoms.ts`.

### `src/components/MobileHUD.tsx` (신규)
- **주요 역할**: 모바일과 데스크탑에서 게임 정보(점수, 레벨, 다음 블록)와 조작법(`KeyHints`)을 표시하는 접이식 Heads-Up Display(HUD)입니다.
- **핵심 로직**:
    - `isHudOpenAtom` 상태에 따라 UI를 열고 닫는 토글 버튼을 제공합니다.
    - `scoreAtom`, `nextBlockAtom` 등의 상태를 구독하여 실시간 정보를 표시합니다.
    - 모바일 화면에서는 `KeyHints`를 자동으로 숨깁니다.
- **의존성**: `react`, `jotai`, `gameAtoms.ts`, `KeyHints.tsx`.

### `src/engine/grid.ts`
- **주요 역할**: 그리드 생성, 충돌 검사 등 상태와 무관한 순수 함수들을 포함하는 유틸리티 파일입니다.
- **핵심 함수**: `createEmptyGrid()`, `isValidMove()`.
- **의존성**: `TetrisBlock.ts`.

## 3. 핵심 로직 흐름 (Data Flow with Jotai)

Jotai 아키텍처는 분산된 atom들의 네트워크를 통해 상태를 관리합니다.

1.  **상태 정의 (`gameAtoms.ts`)**: 게임의 모든 상태(`grids`, `score` 등)가 독립적인 `atom`으로 존재합니다.

3.  **액션 실행 (`gameAtoms.ts`)**:
    - `moveBlockAtom`과 같은 쓰기 가능한 atom이 호출되면, 내부 로직에 따라 관련 상태 atom들을 원자적으로 업데이트합니다.
    - `isValidMove` 같은 순수 함수를 사용하여 다음 상태를 계산합니다.

4.  **상태 전파 및 리렌더링**:
    - `scoreAtom`의 상태가 변경되면, 이 atom을 구독하는 `MobileHUD` 컴포넌트의 점수 표시 부분만 리렌더링됩니다.
    - `currentBlockAtom`이 변경되면 `GameBoard3D`가 리렌더링되어 블록의 움직임을 화면에 표시합니다.
    - **최적화**: 상태 변경이 발생한 atom을 구독하는 컴포넌트만 정확히 리렌더링되므로, 불필요한 렌더링이 최소화됩니다.