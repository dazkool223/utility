import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TOOLS } from '@/core/registry';
import { App } from './App';
import './app.css';

// Tool metadata (no user data) is exposed for the generic end-to-end test.
(window as unknown as { __UTILITY_TOOLS__: unknown }).__UTILITY_TOOLS__ = TOOLS.map(({ id, path, name, inputKind, heavy, example }) => ({
  id,
  path,
  name,
  inputKind,
  heavy: !!heavy,
  example,
}));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
