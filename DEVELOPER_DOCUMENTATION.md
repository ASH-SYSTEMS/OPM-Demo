# OPM-Pro Developer Documentation

Welcome to the development team of **OPM-Pro (Object-Process Methodology Developer and Modeler)**. This document serves as a standard transfer of knowledge, structure, design systems, and rules to allow Google AI Studio models and human engineers to maintain, scale, and develop OPM-Pro with the same craft and discipline.

---

## 1. Architectural Overview

OPM-Pro is a fully functional, high-fidelity React (TypeScript) SPA that enables users to model systems visually and logically using **Object-Process Methodology (OPM - ISO 19450)**.

The framework is decoupled into a clear divide:
*   **Logical Model**: Declared in a single structured schema preserving elements (Objects, Processes, and States) and Link relationships (Structural Links & Procedural Links).
*   **Visual Model**: Maps position indexes (`x`, `y`), dimensions (`width`, `height`), and diagram groupings across separate Object-Process Diagrams (**OPD**s) starting with the **SD** (System Diagram).

### Core State & Types (`src/types.ts`)
*   `LogicalElement`: Retains systemic values, `type` (`ElementType` object, process, or state), `name`, `essence` (physical/informational), and parent-child hierarchy indexes (`parentId`).
*   `VisualElement`: Position and scaling fields relative to their direct parent rendering container.
*   `LogicalLink`: Source/target bindings, cardinalities, and specific functional semantics (`LinkType`).
*   `VisualLink`: Fine-grain diagram parameters such as source/target connector orientations (`sourceAnchor`, `targetAnchor`).

---

## 2. Rendering & Coordinate Systems

OPM-Pro uses **react-konva** to draw and manipulate highly polished vectors on an HTML5 Canvas.

### Hierarchical Nesting & Relative Positioning
*   **Nesting Technique**: Child elements (such as `STATES` within an `OBJECT` container, or zoomed-in subprocesses inside a `PROCESS` bubble) are rendered dynamically inside nested Konva `<Group>` containers.
*   **Coordinate Bounds**: This implies child coordinates (`x`, `y`) are strictly relative to their parent element’s top-left corner.
*   **Absolute Mapping (`getAbsolutePosition`)**: In order to draw links between nested and un-nested variables anywhere on the canvas, `getAbsolutePosition` recursively climbs the parent chain to resolve absolute coordinates on the global Stage.

---

## 3. Strict Boundary Constraints & Auto-Expansion

By OPM definition, states cannot exist graphically outside of their owning object. To ensure user interactions respect this logic, the canvas implements real-time boundary constraints:

### A. Dragging Constraints (`handleElementDragMove` & `handleDragEnd`)
1.  **Top-Left Containment**: Moving a `STATE` coordinate near bounds is padded. It is strictly forbidden from reaching or crossing negative boundaries (constrained to `x >= 6`, `y >= 6` relative to parent).
2.  **Right-Bottom Auto-Expansion**: If a user drags a state near or against the right or bottom edges of its parent object, the parent's `width` or `height` is automatically increased dynamically to ensure the state remains safely inside the enclosing visual box.

### B. Transformer Constraints (`handleTransformEnd`)
*   When a user resizes a parent element (e.g., an Object containing multiple States) using the Konva `Transformer` handles, the system calculates the outer union bounding box of all contained visual children and restricts the parent from shrinking below those dimensions.

---

## 4. OPL Sentence Generation Engine (`src/services/oplService.ts`)

Every visual diagram is automatically parsed back to human-readable **Object-Process Language (OPL)**.
*   **Swapping Protection**: To counter accidental backward links drawn by users, the procedural generator verifies source and target element types (e.g. Swaps directions for `AGENT` and `INSTRUMENT` links on raw endpoints to always generate grammatically sound semantics like `"Agent handles Process"` or `"Process requires Instrument"`).
*   **State-based OPL**: Detects if an entity link originates from or targets an active state, automatically formatting output to:
    *   `<Object> in state <State> handles <Process>.`
    *   `<Process> requires <Object> in state <State>.`

---

## 5. Library Examples

*   **ATM Withdrawal**: Demonstrates simple physical/informational operations, state-to-process consumption, and results.
*   **Multi-level System**: Demonstrates complex in-zooming processes with 3 nested levels of diagrams. In-zoomed external dependency mappings (`Raw Data` to `System Operation`) are cleanly abstracted to prevent orphan link points ("arrows to nothing") at higher abstract views.
*   **OPM-Pro Modeling System (Reflective example)**: A beautiful, detailed representation of OPM-Pro detailing the Modeler (`User`), `OPM-Pro Tool`, `OPM Model` (with states `Drafting` -> `Validated` -> `Exported`), validating processes, and the resulting `OPL Document`.

---

## 6. Development Instructions for Future AI Models

When editing this codebase in Google AI Studio, ensure you:
1.  **Maintain Undo/Redo Compliance**: Always route state changes through `updateModel` so history frames are properly captured. Never modify raw model objects directly without pushing current states to `history`.
2.  **Respect Type Safety**: Keep imports matching the strict TypeScript structure. Do not change React 18 / react-konva / lucide-react dependencies.
3.  **Visual Discipline**: Stick to the Tailwind Slate theme. Maintain generous padding and negative space. Do not insert unrequested stats counters, debugging logs, or visual telemetry on page margins.
