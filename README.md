# 🗄️ Advanced Database ER Diagrammer

A mathematically robust, academic-grade Entity-Relationship (ER) and Enhanced ER (EER) diagramming tool. Built with React and computational geometry, this tool perfectly mimics classic textbook Chen Notation while acting as a live compiler that translates visual graphs into raw Relational Schemas and SQL DDL scripts.

## ✨ Features & Relational Algebra Support

This engine goes far beyond simple drawing. It implements strict relational database constraints and automatically resolves them during SQL compilation.

### 🏛️ Core Entities & Attributes

- **Strong & Weak Entities:** Supports standard entities and weak entities (rendered with double borders).
- **Primary & Partial Keys:** Designate Primary Keys (PK) or Partial Keys/Discriminators (`#`) for weak entities.
- **Composite Attributes:** Indent attributes to create hierarchies. The SQL compiler automatically flattens composite parents (e.g., `name`) into their atomic children (e.g., `name_first`, `name_last`).
- **Multivalued Attributes `{}`:** Visually marked with braces. The compiler automatically normalizes these by spinning up entirely separate junction tables.
- **Derived Attributes `()`:** Visually marked with parentheses. Ignored in physical SQL generation as they are computed dynamically.

### 🔗 Relationships & Cardinality

- **Diamonds & Identifying Relationships:** Standard relationships and weak identifying relationships (double diamonds).
- **Cardinality Mapping (1:1, 1:N, M:N):**
  - `1:N`: Visually draws a directional arrow. The compiler intelligently injects a Foreign Key (FK) into the `N` side.
  - `M:N`: Visually draws standard lines. The compiler resolves this by automatically generating an associative junction table with composite keys.
- **Participation Constraints:** Toggle between Partial (single line) and Total participation (double line).
- **Edge Labels:** Add role indicators or custom cardinality constraints (e.g., `0..*`) directly onto the relationship edges.

### 🚀 Enhanced ER (EER) Concepts

- **Aggregation:** Wrap relationships in dynamic bounding boxes to treat them as higher-level entities. The engine computes the geometric bounds in real-time, and the compiler recursively resolves the nested foreign keys.
- **Specialization / Generalization (ISA):** Drop an `ISA` triangle to map parent/child class hierarchies.
  - Supports **Disjoint (`d`)** vs **Overlapping (`o`)** constraints.
  - Supports **Total** vs **Partial** completeness.
  - **SQL Compilation:** Choose between _Method 1_ (Keep parent table, use FKs in children) or _Method 2_ (Push-down/flatten parent attributes into child tables).

### 🛠️ Engineering UX

- **Smart Auto-Routing:** Edges use custom ray-casting algorithms to perfectly snap to the mathematical centers of complex bounding boxes.
- **Auto-Join Ports:** Hover over any node and drag from the blue anchor points to instantly wire up relationships.
- **History & Workspaces:** Full Undo/Redo tracking and the ability to serialize/save your graph to a JSON file.

---

## 💻 Local Setup Instructions

This project is built using modern, fast tooling (Vite + React + Tailwind CSS).

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Scaffold the Project

Open your terminal and run the following commands to create a fast React environment:

```bash
npm create vite@latest er-diagram -- --template react
cd er-diagram
npm install
```

### 2. Install Dependencies

Install the required icon library and Tailwind CSS (Note: We explicitly use Tailwind v3 for CLI stability):

```bash
npm install lucide-react
npm install tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

### 3. Configure Tailwind

Open the generated `tailwind.config.js` file in your project root and replace its contents with:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Next, open `src/index.css`, delete all the default Vite styling, and paste these Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Add the Application Code

Open the `src/App.jsx` file. Delete everything inside it, and paste the complete React code for the ER Diagrammer.

### 5. Run the Engine

Start your local development server:

```bash
npm run dev
```

Your terminal will provide a local URL (typically `http://localhost:5173/`). Ctrl+Click that link to launch the application in your browser!
