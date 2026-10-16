/// <reference types="chrome" />
import { TOOLS } from '@/core/registry';
import { putHandover } from './handover';

// Context menu on selected text (spec §6). Only `contextMenus` + `storage` permissions; no host access.
const MENU_TOOLS = TOOLS.filter((t) => t.contextMenu && !t.heavy);

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'utility', title: 'Utility', contexts: ['selection'] });
    for (const tool of MENU_TOOLS) {
      chrome.contextMenus.create({ id: tool.id, parentId: 'utility', title: tool.contextMenu!, contexts: ['selection'] });
    }
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  const tool = MENU_TOOLS.find((t) => t.id === info.menuItemId);
  if (!tool || !info.selectionText) return;
  await putHandover({ toolId: tool.id, input: info.selectionText });
  await chrome.tabs.create({ url: chrome.runtime.getURL(`app.html#/${tool.path}`) });
});
