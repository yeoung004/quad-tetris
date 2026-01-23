# Codebase Map (Jotai Atomic State)

This document explains the structure, core logic, and file roles of the Tetris project to help the AI ​​understand the project and grasp the context. This version reflects the atomic state management architecture using **Jotai**.

## 1. Project Structure

`└── StartScreen.tsx
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
    │   ├── GameOverUI.tsx
    │   ├── HelpButton.tsx
    │   └── HelpButton.css
    └── hooks/
        ├── useGameActions.ts
        ├── useWindowSize.ts
        └── useIsMobile.ts
`

## 2. File-by-File Analysis

### `package.json`
- **Main role**: Defines project dependencies. `jotai` has been added for state management.
- **Core Libraries**: `react`, `jotai`, `three`, `@react-three/fiber`.

### `src/utils/analytics.ts` (New: Google Analytics 4 Utility)
- **Main role**: Contains utility functions for tracking Google Analytics 4 (GA4) events.
- **Core logic**:
    - `initializeGA()`: Initializes GA4 using the `VITE_GA_MEASUREMENT_ID` environment variable. It is set to initialize only in the production environment.
    - `trackPageView(path)`: Sends a page view for a specific path to GA4.
    - `trackEvent(name, params)`: Sends a custom event to GA4.
- **Dependencies**: `react-ga4`.
- **Environment variable**: `VITE_GA_MEASUREMENT_ID` (GA4 measurement ID).

### `src/main.tsx`
- **Main role**: Entry point for the React application.
- **Key Changes**: Calls the `initializeGA()` function to initialize GA4 on application load.

### `index.html` (Updated: Absolute Touch Suppression)
- **Main role**: HTML skeleton and global settings for the application.
- **Core logic (add/modify)**:
    - `touch-action: none !important;`, `user-select: none !important;`, `-webkit-user-drag: none !important;`, `-webkit-touch-callout: none !important;` styles are applied to the `body` and `#root` elements to globally disable default touch behaviors in mobile browsers (scrolling, zooming, text selection, context menus, dragging).
    - `height: 100dvh;` is applied to `#root` to prevent the bounce effect in iOS Safari.
    - Global `touchstart` and `touchmove` event listeners have been added with the `passive: false` option to forcibly disable all default touch gestures (especially multi-touch zoom) through `e.preventDefault()`.

### `src/App.tsx` (Updated: Game Over UI Integration)
- **Main role**: The top-level component of the application. Renders `StartScreen`, `GameOverUI`, or the main game components (`GameBoard3D`, `MobileHUD`, `DesktopDashboard`, `MobileSettingsHUD`, etc.) depending on the `isGameStarted` state.
- **Core logic**:
    - Renders `StartScreen` when `isGameStarted` is `false`.
    - Renders `GameOverUI` when `isGameStarted` is `true` and `isGameOver` is `true`, passing the `startGame` action through the `onRestart` prop.
    - Renders the actual game UI components only when the game has started and not ended.
- **Dependencies**: `jotai` (`isGameStartedAtom`, `isGameOverAtom`, `startGameAtom`), `StartScreen`, `GameOverUI`.

### `src/engine/TetrisBlock.ts`
- **Main role**: Defines the `TetrisBlock` class, which represents a single Tetris block.
- **Core logic**:
    - The `TetrisBlock` class has `width` and `height` properties, which are calculated from the block's shape.
    - The `width` and `height` properties are updated in the `constructor` and `rotate` methods.

### `src/atoms/gameAtoms.ts` (Updated: Shared Edge & Face-Shifting Logic)
- **Main role**: Defines all game states and related actions as atoms. State and logic are gathered in one place.
- **Key atom changes**:
    - **`moveBlockAtom`**:
        - **Face-Shifting Logic**: The logic for changing faces has been updated. The face now only changes when the *entire block* has moved off the screen. This is checked using the block's `width` property.
    - **`placeBlockAtom`**:
        - **Shared-Edge Logic**: When a block is placed, if it's on a shared edge, it's written to both adjacent grids. This allows blocks to stack on the corners between faces.

### `src/hooks/useWindowSize.ts`
- **Main role**: A custom hook that returns the current width and height whenever the browser window size changes.
- **Core logic**: Uses a `resize` event listener to manage the window size as state.
- **Usage**: Used in `DesktopDashboard`, `MobileHUD`, `MobileControls`, `MobileSettingsHUD`, `InstructionOverlay`, `useIsMobile` to conditionally render the UI based on screen size.

### `src/hooks/useIsMobile.ts` (New: Mobile Device Detection)
- **Main role**: A new custom hook that detects whether the current device is mobile based on the `useWindowSize` hook.
- **Core logic**: Returns `isMobile` as `true` if the `width` obtained from `useWindowSize` is below a certain breakpoint (e.g., `< 768px`).
- **Usage**: Used in `StartScreen`, `GameOverUI`, etc. for device-specific UI messaging.

### `src/hooks/useGameActions.ts`
- **Main role**: A custom hook that handles mobile touch input. It distinguishes between tap, long press, and swipe gestures to trigger game actions.
- **Core logic**:
    - Uses `e.preventDefault()` on `onTouchStart` and `onTouchEnd` events to disable browser default behaviors (scrolling, zooming). Although a global `e.preventDefault()` has been added, the explicit call in this component maintains the robustness of the logic.
    - A short tap executes a block rotation (`rotateBlock`).
    - A long press of 200ms or more activates "Fast Drop" mode (`isFastDroppingAtom`).
    - A swipe moves the block left or right (`moveBlock`) or drops it down (`dropBlock`).
    - Rotation is prevented during a long press or swipe.
- **Usage**: `GameBoard3D.tsx`.

### `src/components/GameController.tsx`
- **Main role**: A non-rendering component that acts as the game's "engine". It handles all side effects such as the game loop, keyboard input, and lock delay.
- **Core logic**:
    - Gets the setter functions for action atoms like `moveBlockAtom`, `changeFaceAtom`, etc. with `useSetAtom`.
    - Uses `useEffect` to detect keyboard input and run the game loop.
    - **Subscribes to the `isFastDroppingAtom` state and speeds up the game loop to drop the block faster when `true`.**
- **Dependencies**: `react`, `jotai`, `gameAtoms.ts`.

### `src/components/GameBoard3D.tsx` (Updated: Absolute Touch Suppression)
- **Main role**: Responsible for the 3D rendering of the game using `three.js` and handles mobile input.
- **Core logic (add/modify)**:
    - Sets up the `Canvas` from `@react-three/fiber` and configures the 3D scene.
    - Applies `touch-action: none !important`, `user-select: none`, `-webkit-touch-callout: none` styles to the top-level `div` to prevent mobile drag, selection, and context menus.
    - Uses the `useGameActions` hook to handle touch events and binds the corresponding handlers (`handleTouchStart`, `handleTouchEnd`) to the top-level `div`.
- **Dependencies**: `react`, `jotai`, `@react-three/fiber`, `gameAtoms.ts`, `useGameActions.ts`.

### `src/components/MobileControls.tsx`
- **Main role**: Provides mobile-only on-screen left and right touch areas to rotate the cube's face.
- **Core logic**:
    - Does not render in desktop viewports using the `useWindowSize` hook.
    - Calls `changeFaceAtom` to trigger a cube face change.
    - **Now displayed as translucent neon-style vertical bars on the left and right of the screen so that the user can clearly recognize them. Each bar contains '<', '>' icons and has a glowing effect when tapped.**
    - Applies a 300ms debounce to touch/click events to prevent multiple actions from being triggered by a single tap.
- **Dependencies**: `react`, `jotai`, `gameAtoms.ts`, `useWindowSize.ts`.

### `src/components/InstructionOverlay.tsx`
- **Main role**: An overlay component that explains how to play, the controls, and the winning conditions.
- **Core logic**:
    - Activated by the '?' button on the `StartScreen`.
    - Uses the `useWindowSize` hook to show different layouts for mobile and desktop. (Mobile: vertical scroll, Desktop: fixed dashboard)
    - Includes CSS animations for a smooth fade-in effect.
- **Dependencies**: `react`, `useWindowSize.ts`.

### `src/components/HelpButton.tsx` and `HelpButton.css` (New)
- **Main role**: A reusable help button component with a neon glow effect.
- **Core logic**:
    - The button is a simple `?` with CSS animations to make it "pop".
    - It takes an `onClick` handler to toggle the `InstructionOverlay`.

### `src/components/MobileSettingsHUD.tsx`
- **Main role**: Displays a settings (gear) icon in the top-left corner of the screen, **for mobile only**.
- **Core logic**:
    - Does not render in desktop viewports using the `useWindowSize` hook.
    - Tapping the settings icon reveals a menu to toggle **Focus Mode** and **Ghost Mode**.
    - Calls `toggleFocusModeAtom` and `toggleGhostAtom` to change the relevant game states.
    - Safely positioned on the mobile screen considering `safe-area-inset` and `dvh` units in CSS.
- **Dependencies**: `react`, `jotai`, `gameAtoms.ts`, `useWindowSize.ts`.

### `src/components/MobileHUD.tsx`
- **Main role**: A HUD that displays game information (score, level, etc.), **for mobile only**.
- **Core logic**:
    - Does not render in desktop viewports using the `useWindowSize` hook.
    - **Displays additional information, including `NextBlockPreview`, only while the 'i' button is being pressed and held (`press-and-hold`).**
    - Does not render if `isGameStarted` is `false` to prevent interaction conflicts with `StartScreen`.
- **Dependencies**: `react`, `jotai`, `gameAtoms.ts`, `NextBlockPreview.tsx`, `useWindowSize.ts`.

### `src/components/DesktopDashboard.tsx`
- **Main role**: A permanent dashboard that always displays game information, the next block, and controls, **for desktop only**.
- **Core logic**:
    - Does not render in mobile viewports using the `useWindowSize` hook.
    - Places panels on the left and right of the screen to display game information.
- **Dependencies**: `react`, `jotai`, `gameAtoms.ts`, `NextBlockPreview.tsx`, `KeyHints.tsx`, `useWindowSize.ts`.

### `src/components/NextBlockPreview.tsx`
- **Main role**: A reusable component that renders the next Tetris block in 3D.
- **Usage**: Used in both `MobileHUD` and `DesktopDashboard`.
- **Dependencies**: `react`, `jotai`, `@react-three/fiber`, `gameAtoms.ts`.

### `src/components/StartScreen.tsx` (Updated: UI/UX)
- **Main role**: Displays the game start screen.
- **Core logic**:
    - Calls `startGameAtom` to start or restart the game.
    - Uses the `useIsMobile` hook to conditionally render "PRESS SPACE TO START" or "TOUCH SCREEN TO START" messages depending on the device type.
    - **Includes the new `HelpButton` component to show the `InstructionOverlay`.**
- **Dependencies**: `jotai` (`isGameStartedAtom`, `startGameAtom`), `useIsMobile`, `InstructionOverlay`, `HelpButton`.

### `src/components/GameOverUI.tsx` (Updated: UI/UX)
- **Main role**: A component that displays the "GAME OVER" message and restart options when the game ends.
- **Core logic**:
    - Receives an `onRestart` prop to trigger the game restart logic.
    - Uses the `useIsMobile` hook to conditionally render "PRESS SPACE TO RESTART" or "TOUCH SCREEN TO RESTART" messages depending on the device type.
    - **Includes the new `HelpButton` component to show the `InstructionOverlay`.**
- **Dependencies**: `useIsMobile`, `HelpButton`, `InstructionOverlay`.

### `src/engine/grid.ts` (Updated: Shared-Edge Logic)
- **Main role**: A utility file containing pure functions independent of state, such as grid creation and collision detection.
- **Core logic**:
    - **`isValidMove(grids, activeFace, block, newPosition)`**:
        - **Shared-Edge Logic**: The collision detection now treats the edges of the faces as shared space. If a block is on an edge, it checks for collisions on both the current and the adjacent face.
- **Dependencies**: `TetrisBlock`.

## 3. Core Logic Flow (Data Flow with Jotai)

The Jotai architecture manages state through a network of distributed atoms. The UI is designed to be responsive.

1.  **State Definition (`gameAtoms.ts`)**: All game states (`grids`, `score`, `isFastDroppingAtom`, `isFocusModeAtom`, `showGhostAtom`, etc.) exist as independent `atom`s. Now `isGameOverAtom` manages the game over state, and `startGameAtom` correctly initializes the state when the game starts or restarts.

2.  **UI Rendering (Responsive)**:
    - The `useWindowSize` hook detects the screen size.
    - On desktop sizes (`>=1024px`), `DesktopDashboard` is rendered to show a permanent information panel. `MobileHUD`, `MobileControls`, `MobileSettingsHUD` are hidden.
    - On mobile sizes (`<1024px`), `MobileHUD` (shows information while the 'i' button is pressed), `MobileControls` (left and right touch areas), `MobileSettingsHUD` (settings menu) are rendered. `DesktopDashboard` is hidden.
    - `App.tsx` conditionally renders `StartScreen`, `GameOverUI`, or the actual game UI based on the `isGameStarted` and `isGameOver` states.

3.  **Action Execution (`GameController`, `useGameActions`, etc.)**:
    - **Keyboard Input (`GameController`)**: Directly calls atoms like `moveBlockAtom`, `rotateBlockAtom`, etc. based on `keydown` events.
    - **Touch Input (`GameBoard3D` -> `useGameActions`)**: Touch events on `GameBoard3D` are delegated to the `useGameActions` hook. This hook analyzes gestures (tap, long press, swipe) to update states like `moveBlockAtom`, `rotateBlockAtom`, `isFastDroppingAtom`, etc.
    - `MobileControls` calls `changeFaceAtom` to rotate the view.
    - `MobileSettingsHUD` calls `toggleFocusModeAtom` and `toggleGhostAtom` to change game settings.
    - `StartScreen` and `GameOverUI` call `startGameAtom` to start or restart the game based on user input.

4.  **State Propagation and Rerendering**:
    - When the state of `scoreAtom` changes, only the score display part of the `DesktopDashboard` or `MobileHUD` component that subscribes to this atom is rerendered.
    - When `isFastDroppingAtom` becomes `true`, the game loop in `GameController` restarts at a faster speed.
    - A change in `isGameStartedAtom` or `isGameOverAtom` affects the top-level conditional rendering in `App.tsx`, causing a switch to the `StartScreen`, `GameOverUI`, or the game screen.
    - Only the components that subscribe to the atom whose state has changed are accurately rerendered, thus minimizing unnecessary rendering.
