/**
 * Claw Agent 本地存储工具
 */
import { ClawTask, ClawStorage } from "../types/claw";

const CLAW_STORAGE_KEY = "claw_agent_tasks";
const MAX_TASKS = 100;

function loadStorage(): ClawStorage {
  try {
    const raw = localStorage.getItem(CLAW_STORAGE_KEY);
    if (!raw) return { tasks: [], activeTaskId: null };
    return JSON.parse(raw) as ClawStorage;
  } catch {
    return { tasks: [], activeTaskId: null };
  }
}

function persistStorage(data: ClawStorage): void {
  try {
    localStorage.setItem(CLAW_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadClawTasks(): ClawTask[] {
  return loadStorage().tasks;
}

export function saveClawTask(task: ClawTask): void {
  const storage = loadStorage();
  const idx = storage.tasks.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    storage.tasks[idx] = task;
  } else {
    storage.tasks = [task, ...storage.tasks].slice(0, MAX_TASKS);
  }
  persistStorage(storage);
}

export function deleteClawTask(taskId: string): void {
  const storage = loadStorage();
  storage.tasks = storage.tasks.filter((t) => t.id !== taskId);
  if (storage.activeTaskId === taskId) storage.activeTaskId = null;
  persistStorage(storage);
}

export function loadActiveClawTaskId(): string | null {
  return loadStorage().activeTaskId;
}

export function saveActiveClawTaskId(id: string | null): void {
  const storage = loadStorage();
  storage.activeTaskId = id;
  persistStorage(storage);
}
