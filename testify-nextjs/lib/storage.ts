import { Session, KnowledgeBase } from '@/types';

// Use global to persist across hot reloads in development
declare global {
  var sessionsStore: Map<string, Session> | undefined;
  var knowledgeBasesStore: Map<string, KnowledgeBase> | undefined;
}

// Shared in-memory storage for sessions (persists across hot reloads)
export const sessions = global.sessionsStore || new Map<string, Session>();
if (!global.sessionsStore) {
  global.sessionsStore = sessions;
}

// Shared in-memory storage for knowledge bases (persists across hot reloads)
export const knowledgeBases = global.knowledgeBasesStore || new Map<string, KnowledgeBase>();
if (!global.knowledgeBasesStore) {
  global.knowledgeBasesStore = knowledgeBases;
}

