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
    - **Primitive Atoms**: `gridsAtom`, `currentBlockAtom`, `scoreAtom`, `isGameOverAtom` 등 기본 상태와 더불어, 충돌 경고 시스템을 위한 `isWarningAtom`, `isInputLockedAtom`, `collisionBlockAtom`이 추가되었습니다.
    - **Derived Atoms**: `currentGridAtom` 같이 다른 atom을 조합하여 만드는 읽기 전용 파생 상태.
    - **Writable Action Atoms**: `startGameAtom`, `moveBlockAtom`, `placeBlockAtom` 등 게임 로직을 실행하는 쓰기 전용 atom. 특히, 충돌 감지 시 즉시 게임을 종료하는 대신, `triggerCollisionWarningAtom`이라는 새로운 액션 atom을 호출합니다. 이 atom은 `isWarning` 상태를 활성화하고, 약 800ms의 '자비의 시간(Mercy Period)'을 부여한 뒤 게임을 종료시켜 사용자 경험을 향상시킵니다.

### `src/components/GameController.tsx`
- **주요 역할**: 게임의 "엔진" 역할을 수행하는 보이지 않는(non-rendering) 컴포넌트입니다. 게임 루프, 키보드 입력, 락 딜레이 등 모든 사이드 이펙트를 처리합니다.
- **핵심 로직**:
    - ... (기존 내용)
    - `useAtomValue`로 `isGameOver`, `level`, 그리고 **`isInputLockedAtom`** 등의 상태를 구독하여 로직에 사용합니다. `isInputLocked`가 `true`이면, '자비의 시간' 동안 모든 키보드 입력을 차단하여 안정성을 확보합니다.

### `src/components/GameBoard3D.tsx`
- **주요 역할**: `three.js`를 사용하여 게임의 3D 렌더링을 담당합니다. 충돌 시 시각적 피드백을 강화하는 연출을 포함합니다.
- **핵심 로직**:
    - `useAtomValue`를 사용하여 렌더링에 필요한 상태(`gridsAtom`, `currentBlockAtom` 등)와 **`isWarningAtom`**, **`collisionBlockAtom`**을 구독합니다.
    - **Collision Warning (충돌 경고 연출)**: `isWarning` 상태가 되면, 일반 `currentBlock` 대신 `collisionBlock`을 `CollisionBlock3D`라는 특수 컴포넌트로 렌더링합니다. 이 컴포넌트는 강렬한 붉은색 네온 재질을 `useFrame` 훅으로 깜빡이게 하여 충돌 지점을 시각적으로 강조합니다.
    - **Death UI Effects (사망 연출 효과)**: `isWarning` 상태 동안, `useFrame` 훅을 통해 카메라를 미세하게 흔드는 **카메라 셰이크(Camera Shake)** 효과와, `@react-three/postprocessing` 라이브러리의 `Vignette`(붉은색), `Noise` 효과를 활성화하여 사용자에게 위험 상황을 극적으로 전달합니다.
    - **GameOverOverlay**: `isGameOverAtom`이 `true`가 되면 활성화됩니다. 단순한 텍스트 대신, 사이버펑크 스타일의 디자인(네온, 글리치 텍스트)과 "COLLISION DETECTED" 같은 구체적인 메시지를 `gameOverMessageAtom`으로부터 받아 표시하여 몰입감을 높입니다.

### `src/engine/grid.ts`
- **주요 역할**: 기존 `gameReducer.ts`에서 순수 로직 부분만 분리한 유틸리티 파일입니다. 그리드 생성, 충돌 검사 등 상태와 무관한 함수들을 포함합니다.
- **핵심 함수**: `createEmptyGrid()`, `isValidMove()`.
- **의존성**: `TetrisBlock.ts`.

## 3. 핵심 로직 흐름 (New Data Flow with Jotai)
... (기존 내용)

## 6. 핵심 게임플레이 메커니즘 (Core Gameplay Mechanics)

### 충돌 인식 및 자비의 시간 (Collision Awareness & Mercy Period)
- **정의**: 사용자가 왜 게임오버가 되었는지 명확히 인지할 수 있도록 도입된 UX 개선 메커니즘입니다. 블록이 다른 블록과 겹치거나 맵을 벗어나는 등 `isValidMove`가 `false`를 반환하는 모든 상황에서 즉시 게임이 종료되지 않고, 짧은 '자비의 시간'이 주어집니다.
- **로직 흐름**:
    1. **사용자 입력/게임 로직**: `moveBlockAtom`, `rotateBlockAtom`, `changeFaceAtom` 등에서 이동/회전 후의 위치가 유효하지 않음(`isValidMove`가 `false`)을 감지합니다.
    2. **충돌 경고 발동 (`triggerCollisionWarningAtom`)**: 즉시 `isGameOverAtom`을 `true`로 설정하는 대신, `triggerCollisionWarningAtom` 액션을 호출합니다. 이 액션은 다음 상태들을 설정합니다:
        - `isWarningAtom`: `true`로 설정하여 시각적 경고 연출을 시작합니다.
        - `isInputLockedAtom`: `true`로 설정하여 약 800ms의 경고 시간 동안 추가 입력을 막습니다.
        - `collisionBlockAtom`: 충돌이 발생한 위치의 블록 정보를 저장합니다.
        - `gameOverMessageAtom`: "COLLISION DETECTED" 등 구체적인 충돌 원인을 설정합니다.
    3. **시각적 피드백 (`GameBoard3D.tsx`)**:
        - `isWarningAtom`의 값이 `true`가 되면, `GameBoard3D`는 `collisionBlock`을 붉게 깜빡이는 재질로 렌더링합니다.
        - 동시에 카메라 셰이크, 붉은 비네트, 노이즈 효과가 장면에 적용됩니다.
    4. **게임 오버 확정**: `triggerCollisionWarningAtom` 내부의 `setTimeout`(약 800ms)이 만료되면, `isGameOverAtom`을 `true`로 설정하여 최종적으로 게임 오버 UI를 표시합니다.
- **목적**: 이 메커니즘은 갑작스러운 게임 종료로 인한 사용자의 당혹감을 줄이고, "시스템 오류"와 같은 연출을 통해 패배의 경험을 좀 더 흥미롭고 몰입감 있게 만듭니다. '면 전환 사망' 역시 이 로직에 통합되어 일관된 경험을 제공합니다.

이 문서는 프로젝트가 발전함에 따라 지속적으로 업데이트되어야 합니다.