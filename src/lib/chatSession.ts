export const CHAT_DRAFT_KEY = 'melasma_chat_draft_v1';
export const CHAT_CLEAR_EVENT = 'melasma:clear-chat-session';

export function readChatDraft(): string {
  try {
    return sessionStorage.getItem(CHAT_DRAFT_KEY) || '';
  } catch {
    return '';
  }
}

export function saveChatDraft(value: string): void {
  try {
    if (value) sessionStorage.setItem(CHAT_DRAFT_KEY, value);
    else sessionStorage.removeItem(CHAT_DRAFT_KEY);
  } catch {
    // Storage can be unavailable in private/restricted browser contexts.
  }
}

export function clearChatSession(): void {
  try {
    sessionStorage.removeItem(CHAT_DRAFT_KEY);
  } catch {
    // The in-memory event below still clears an open chatbot instance.
  }
  window.dispatchEvent(new Event(CHAT_CLEAR_EVENT));
}
