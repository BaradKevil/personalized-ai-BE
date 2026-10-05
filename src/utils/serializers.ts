/**
 * ===========================================
 *  Response Serializers
 * ===========================================
 *
 * Maps database rows (snake_case columns) to the
 * camelCase payload shapes consumed by the Novi
 * frontend. Keeps a single source of truth for the
 * API contract.
 */

import Agent from '../models/agent.model';
import User from '../models/user.model';
import UserPreference from '../models/user-preference.model';
import Conversation from '../models/conversation.model';
import Message from '../models/message.model';
import Memory from '../models/memory.model';
import Task from '../models/task.model';
import Goal from '../models/goal.model';
import Notification from '../models/notification.model';
import ActivityLog from '../models/activity-log.model';

/**
 * Maps a User row to the public profile payload.
 * Never exposes the password hash.
 */
export const toUserPayload = (user: User) => ({
  id: user.id,
  name: user.full_name,
  email: user.email,
  mobile: user.mobile_number,
  avatarColor: user.avatar_color,
  timezone: user.timezone,
  status: user.status,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

/**
 * Maps an Agent row to the public agent payload.
 */
export const toAgentPayload = (agent: Agent) => ({
  id: agent.id,
  name: agent.name,
  avatar: agent.avatar,
  color: agent.color,
  personality: agent.personality,
});

/**
 * Maps a UserPreference row to the settings payload.
 */
export const toSettingsPayload = (prefs: UserPreference) => ({
  timezone: prefs.timezone,
  language: prefs.language,
  theme: prefs.theme,
  memoryEnabled: prefs.memory_enabled,
  conciseAnswers: prefs.concise_answers,
  dailyBriefing: prefs.daily_briefing_enabled,
  proactiveSuggestions: prefs.proactive_suggestions,
  inAppNotifications: prefs.in_app_notifications,
  browserNotifications: prefs.browser_notifications,
});

/**
 * Maps a Conversation row to the conversation payload.
 */
export const toConversationPayload = (conversation: Conversation) => ({
  id: conversation.id,
  title: conversation.title,
  status: conversation.status,
  createdAt: conversation.created_at,
  updatedAt: conversation.updated_at,
});

/**
 * Maps a Message row to the message payload.
 */
export const toMessagePayload = (message: Message) => ({
  id: message.id,
  conversationId: message.conversation_id,
  role: message.role,
  content: message.content,
  metadata: message.metadata,
  createdAt: message.created_at,
  updatedAt: message.updated_at,
});

/**
 * Maps a Memory row to the memory payload.
 */
export const toMemoryPayload = (memory: Memory) => ({
  id: memory.id,
  category: memory.type,
  content: memory.content,
  importance: memory.importance,
  source: memory.source,
  createdAt: memory.created_at,
  updatedAt: memory.updated_at,
});

/**
 * Maps a Task row to the task payload.
 */
export const toTaskPayload = (task: Task) => ({
  id: task.id,
  title: task.title,
  notes: task.notes,
  status: task.status,
  priority: task.priority,
  dueDate: task.due_at,
  completed: task.status === 'completed',
  completedAt: task.completed_at,
  recurrence: task.recurrence,
  tags: task.tags,
  createdAt: task.created_at,
  updatedAt: task.updated_at,
});

/**
 * Maps a Goal row to the goal payload.
 */
export const toGoalPayload = (goal: Goal) => ({
  id: goal.id,
  title: goal.title,
  description: goal.description,
  status: goal.status,
  progress: goal.progress,
  targetDate: goal.target_date,
  steps: goal.steps,
  createdAt: goal.created_at,
  updatedAt: goal.updated_at,
});

/**
 * Maps a Notification row to the notification payload.
 * `read` is derived from read_at.
 */
export const toNotificationPayload = (notification: Notification) => ({
  id: notification.id,
  kind: notification.type,
  title: notification.title,
  body: notification.message,
  priority: notification.priority,
  read: notification.read_at !== null,
  readAt: notification.read_at,
  metadata: notification.metadata,
  createdAt: notification.created_at,
});

/**
 * Maps an ActivityLog row to the activity log payload.
 */
export const toActivityLogPayload = (log: ActivityLog) => ({
  id: log.id,
  action: log.action_performed,
  ipAddress: log.ip_address,
  description: log.description,
  status: log.status,
  createdAt: log.created_at,
});
