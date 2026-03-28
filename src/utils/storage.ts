/**
 * 对话历史存储工具
 * 使用localStorage进行持久化存储，支持对话历史的保存和加载
 */

import { Conversation, Message } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'claw_conversations',
  ACTIVE_CONVERSATION_ID: 'claw_active_conversation_id',
  LAST_SYNC_TIME: 'claw_last_sync_time',
  STORAGE_VERSION: 'claw_storage_version',
} as const;

const CURRENT_VERSION = '1.0.0';

// 存储版本兼容性检查
function checkStorageVersion(): boolean {
  try {
    const savedVersion = localStorage.getItem(STORAGE_KEYS.STORAGE_VERSION);
    if (!savedVersion) {
      localStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_VERSION);
      return true;
    }
    
    // 简单的版本兼容性检查（这里可以根据需要进行更复杂的版本迁移逻辑）
    const [major, minor] = savedVersion.split('.').map(Number);
    const [currentMajor, currentMinor] = CURRENT_VERSION.split('.').map(Number);
    
    if (major < currentMajor) {
      // 主版本不兼容，需要数据迁移
      console.warn(`存储版本不兼容: ${savedVersion} -> ${CURRENT_VERSION}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('检查存储版本时出错:', error);
    return false;
  }
}

/**
 * 保存所有对话到本地存储
 */
export function saveConversations(conversations: Conversation[]): boolean {
  try {
    if (!checkStorageVersion()) {
      console.warn('存储版本检查失败，跳过保存');
      return false;
    }
    
    const conversationsToSave = conversations.map(conversation => ({
      ...conversation,
      // 确保日期对象被序列化为字符串
      createdAt: conversation.createdAt.toISOString(),
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      messages: conversation.messages.map(message => ({
        ...message,
        timestamp: message.timestamp.toISOString(),
      })),
    }));
    
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversationsToSave));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, Date.now().toString());
    
    return true;
  } catch (error) {
    console.error('保存对话时出错:', error);
    return false;
  }
}

/**
 * 从本地存储加载所有对话
 */
export function loadConversations(): Conversation[] {
  try {
    const savedData = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!savedData) {
      return [];
    }
    
    const parsedData = JSON.parse(savedData);
    
    // 将字符串日期恢复为Date对象
    return parsedData.map((conversation: any) => ({
      ...conversation,
      createdAt: new Date(conversation.createdAt),
      lastMessageAt: new Date(conversation.lastMessageAt),
      messages: conversation.messages.map((message: any) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      })),
    }));
  } catch (error) {
    console.error('加载对话时出错:', error);
    // 如果数据损坏，返回空数组并清除存储
    clearConversations();
    return [];
  }
}

/**
 * 保存活跃对话ID
 */
export function saveActiveConversationId(conversationId: string | null): boolean {
  try {
    if (conversationId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, conversationId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
    }
    return true;
  } catch (error) {
    console.error('保存活跃对话ID时出错:', error);
    return false;
  }
}

/**
 * 加载活跃对话ID
 */
export function loadActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
  } catch (error) {
    console.error('加载活跃对话ID时出错:', error);
    return null;
  }
}

/**
 * 获取最后同步时间
 */
export function getLastSyncTime(): Date | null {
  try {
    const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
    return timestamp ? new Date(parseInt(timestamp)) : null;
  } catch (error) {
    console.error('获取最后同步时间时出错:', error);
    return null;
  }
}

/**
 * 保存单个对话
 */
export function saveConversation(conversation: Conversation): boolean {
  try {
    const conversations = loadConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    if (existingIndex >= 0) {
      // 更新现有对话
      conversations[existingIndex] = conversation;
    } else {
      // 添加新对话
      conversations.unshift(conversation);
    }
    
    return saveConversations(conversations);
  } catch (error) {
    console.error('保存单个对话时出错:', error);
    return false;
  }
}

/**
 * 删除对话
 */
export function deleteConversation(conversationId: string): boolean {
  try {
    const conversations = loadConversations();
    const filteredConversations = conversations.filter(c => c.id !== conversationId);
    return saveConversations(filteredConversations);
  } catch (error) {
    console.error('删除对话时出错:', error);
    return false;
  }
}

/**
 * 获取存储统计信息
 */
export function getStorageStats(): {
  conversationCount: number;
  totalMessages: number;
  storageSize: number;
  lastSyncTime: Date | null;
} {
  try {
    const conversations = loadConversations();
    const totalMessages = conversations.reduce(
      (sum, conv) => sum + conv.messages.length, 
      0
    );
    
    const conversationsData = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    const storageSize = conversationsData ? conversationsData.length : 0;
    
    return {
      conversationCount: conversations.length,
      totalMessages,
      storageSize,
      lastSyncTime: getLastSyncTime(),
    };
  } catch (error) {
    console.error('获取存储统计时出错:', error);
    return {
      conversationCount: 0,
      totalMessages: 0,
      storageSize: 0,
      lastSyncTime: null,
    };
  }
}

/**
 * 导出所有对话数据（用于备份）
 */
export function exportConversations(): string {
  try {
    const conversations = loadConversations();
    return JSON.stringify({
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      conversations,
    }, null, 2);
  } catch (error) {
    console.error('导出对话时出错:', error);
    return JSON.stringify({ error: '导出失败' });
  }
}

/**
 * 导入对话数据（从备份恢复）
 */
export function importConversations(data: string): boolean {
  try {
    const parsedData = JSON.parse(data);
    
    // 验证数据格式
    if (!parsedData.conversations || !Array.isArray(parsedData.conversations)) {
      throw new Error('无效的对话数据格式');
    }
    
    // 备份现有数据
    const backupData = exportConversations();
    localStorage.setItem('claw_conversations_backup', backupData);
    
    // 保存导入的数据
    const conversationsToSave = parsedData.conversations.map((conversation: any) => ({
      ...conversation,
      createdAt: new Date(conversation.createdAt),
      lastMessageAt: new Date(conversation.lastMessageAt),
      messages: conversation.messages.map((message: any) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      })),
    }));
    
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversationsToSave));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, Date.now().toString());
    
    console.log('对话数据导入成功');
    return true;
  } catch (error) {
    console.error('导入对话时出错:', error);
    return false;
  }
}

/**
 * 清除所有对话数据
 */
export function clearConversations(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC_TIME);
    console.log('对话数据已清除');
    return true;
  } catch (error) {
    console.error('清除对话时出错:', error);
    return false;
  }
}

/**
 * 检查本地存储是否可用
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__claw_storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.error('本地存储不可用:', error);
    return false;
  }
}

/**
 * 自动保存机制
 */
export class AutoSaver {
  private saveQueue: Map<string, Conversation> = new Map();
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly SAVE_DELAY = 1000; // 1秒延迟保存
  
  /**
   * 排队保存对话
   */
  queueSave(conversation: Conversation): void {
    this.saveQueue.set(conversation.id, conversation);
    
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.flushSaveQueue();
    }, this.SAVE_DELAY);
  }
  
  /**
   * 立即刷新保存队列
   */
  flushSaveQueue(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    if (this.saveQueue.size === 0) {
      return;
    }
    
    const conversations = loadConversations();
    const updatedConversations = [...conversations];
    
    this.saveQueue.forEach((conversation) => {
      const existingIndex = updatedConversations.findIndex(c => c.id === conversation.id);
      
      if (existingIndex >= 0) {
        updatedConversations[existingIndex] = conversation;
      } else {
        updatedConversations.unshift(conversation);
      }
    });
    
    saveConversations(updatedConversations);
    this.saveQueue.clear();
    
    console.log(`自动保存了 ${updatedConversations.length} 个对话`);
  }
  
  /**
   * 取消所有排队保存
   */
  cancelAll(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveQueue.clear();
  }
}