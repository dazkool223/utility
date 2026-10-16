import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { setPendingInput } from '@/core/host';
import { App } from '~web/App';
import { WEBSITE_URL } from '~web/surface';
import { takeHandover } from './handover';
import './extension.css';

// Full catalog in an Extension tab. Same shell as the Website, with hash routing and Heavy Tools linked out.
async function main() {
  const handover = await takeHandover().catch(() => null);
  if (handover) setPendingInput(handover.toolId, { input: handover.input });
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Router hook={useHashLocation}>
        <App surface={{ surface: 'extension', websiteUrl: WEBSITE_URL }} />
      </Router>
    </StrictMode>,
  );
}

void main();
