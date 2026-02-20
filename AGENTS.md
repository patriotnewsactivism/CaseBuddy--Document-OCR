# AGENTS.md - CaseBuddy Intelligent OCR

This document provides guidance for agentic coding agents working in this repository.

## Project Overview

CaseBuddy Intelligent OCR is a React + TypeScript + Vite application for document OCR processing using Tesseract.js. It extracts text, entities, and summaries from PDF and image files entirely in the browser.

## Build/Lint/Test Commands

```bash
# Install dependencies
npm install

# Development server (runs on port 3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# TypeScript type checking (no separate script - use tsc)
npx tsc --noEmit
```

**Note:** This project does not have configured test or lint scripts. Running `npm run dev` will catch most build errors.

## Environment Setup

No API keys required. Tesseract.js runs entirely in the browser.

## Project Structure

```
/
├── App.tsx              # Main application component
├── index.tsx            # React entry point
├── types.ts             # TypeScript type definitions and enums
├── constants.ts         # Application constants
├── components/          # React components (one file per component)
│   ├── DocumentList.tsx
│   ├── DocumentViewer.tsx
│   ├── ExtractionPanel.tsx
│   ├── IntegrationSettings.tsx
│   └── CloudImportDialog.tsx
├── services/            # External service integrations
│   └── ocrService.ts    # Tesseract.js OCR processing
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

## Code Style Guidelines

### Imports

Order imports as follows, separated by blank lines:
1. React imports (e.g., `import React, { useState } from 'react'`)
2. Third-party libraries (e.g., `import { v4 as uuidv4 } from 'uuid'`)
3. Local types and constants (e.g., `import { DocumentAsset } from './types'`)
4. Local components and services
5. Icons from lucide-react (grouped together)

```typescript
import React, { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { DocumentAsset, ProcessingStatus } from './types';
import { DEFAULT_INTEGRATION_CONFIG } from './constants';
import { performOCR } from './services/ocrService';

import DocumentList from './components/DocumentList';
import { BrainCircuit, Settings as SettingsIcon } from 'lucide-react';
```

### TypeScript

- Use `interface` for object type definitions (not `type`)
- Use `enum` for constant sets (see `ProcessingStatus`, `SourceType` in `types.ts`)
- Components use `React.FC<Props>` type annotation
- Prefer explicit typing over `any` - use `unknown` when type is uncertain
- Extract shared types to `types.ts` at the root level

```typescript
// Component props interface
interface Props {
  documents: DocumentAsset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const DocumentList: React.FC<Props> = ({ documents, selectedId, onSelect }) => {
```

### Naming Conventions

- **Components**: PascalCase files matching component name (`DocumentList.tsx`)
- **Interfaces**: PascalCase (`DocumentAsset`, `IntegrationConfig`)
- **Enums**: PascalCase for enum name, SCREAMING_SNAKE_CASE for values
- **Functions**: camelCase (`performOCR`, `handleFileUpload`)
- **Constants**: SCREAMING_SNAKE_CASE (`APP_NAME`, `OCR_MODEL_NAME`)
- **Private helpers**: prefix with underscore or keep in module scope

### Component Patterns

- Use functional components with hooks (no class components)
- Use `export default` for component exports
- Destructure props in function signature
- Use `interface Props` defined above the component

```typescript
interface Props {
  document: DocumentAsset | null;
  onRetry: () => void;
}

const ExtractionPanel: React.FC<Props> = ({ document, onRetry }) => {
  const [copied, setCopied] = useState(false);
  // ...
};

export default ExtractionPanel;
```

### Error Handling

- Wrap async operations in try/catch blocks
- Extract error messages safely: `error.message` or fallback to generic message
- Log errors to console with descriptive prefix
- Update UI state to show error status to user

```typescript
try {
  const data = await performOCR(file);
  updateDocStatus(newDoc.id, ProcessingStatus.COMPLETED, data);
} catch (error: any) {
  console.error(error);
  updateDocStatus(newDoc.id, ProcessingStatus.ERROR, undefined, error.message);
}
```

### Styling

- Uses Tailwind CSS for all styling
- Use Tailwind utility classes directly in JSX (no separate CSS files)
- Brand colors use `brand-*` prefix (e.g., `bg-brand-600`, `text-brand-500`)
- Follow mobile-first responsive design patterns
- Responsive breakpoints: `md:` for tablets, `lg:` for desktops

### State Management

- Use React's built-in hooks (`useState`, `useRef`, `useCallback`)
- Lift state up to parent components when shared
- Use `useCallback` for event handlers passed as props when dependencies matter

### File Organization

- One component per file
- Keep components under 300 lines; extract sub-components if needed
- Services handle external API calls and data transformation
- Constants define configuration values and enums live in `types.ts`

### Environment Variables

Currently no environment variables are required. Tesseract.js runs client-side.

### Path Aliases

- Use `@/*` to reference files from root directory
- Example: `import { performOCR } from '@/services/ocrService'`

### Comments

- Keep comments minimal - prefer self-documenting code
- Use comments for "why" not "what"
- JSDoc comments for complex utility functions only
