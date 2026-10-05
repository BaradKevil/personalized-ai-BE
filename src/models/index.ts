/**
 * ===========================================
 *  Model Registry & Associations
 * ===========================================
 *
 * Central hub for importing all Sequelize models
 * and defining their associations. Import models
 * from this file throughout the application to
 * ensure consistent initialization.
 */

import sequelize from '../../config/database';
import User from './user.model';
import Agent from './agent.model';
import UserPreference from './user-preference.model';
import UserToken from './user-token.model';
import ActivityLog from './activity-log.model';
import Conversation from './conversation.model';
import Message from './message.model';
import Memory from './memory.model';
import Task from './task.model';
import Goal from './goal.model';
import Notification from './notification.model';
import Habit from './habit.model';
import HabitLog from './habit-log.model';

// -------------------------------------------------
//  Define Associations
// -------------------------------------------------

/** User has one Agent */
User.hasOne(Agent, {
  foreignKey: 'user_id',
  as: 'agent',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** Agent belongs to User */
Agent.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

/** User has one UserPreference */
User.hasOne(UserPreference, {
  foreignKey: 'user_id',
  as: 'preferences',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** UserPreference belongs to User */
UserPreference.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

/** User has many UserTokens */
User.hasMany(UserToken, {
  foreignKey: 'user_id',
  as: 'tokens',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** UserToken belongs to User */
UserToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

/** User has many ActivityLogs */
User.hasMany(ActivityLog, {
  foreignKey: 'user_id',
  as: 'activity_logs',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

/** ActivityLog belongs to User */
ActivityLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

/** User has many Conversations */
User.hasMany(Conversation, {
  foreignKey: 'user_id',
  as: 'conversations',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** Conversation belongs to User */
Conversation.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

/** Agent has many Conversations */
Agent.hasMany(Conversation, {
  foreignKey: 'agent_id',
  as: 'conversations',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** Conversation belongs to Agent */
Conversation.belongsTo(Agent, {
  foreignKey: 'agent_id',
  as: 'agent',
});

/** Conversation has many Messages */
Conversation.hasMany(Message, {
  foreignKey: 'conversation_id',
  as: 'messages',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** Message belongs to Conversation */
Message.belongsTo(Conversation, {
  foreignKey: 'conversation_id',
  as: 'conversation',
});

/** User has many Messages */
User.hasMany(Message, {
  foreignKey: 'user_id',
  as: 'messages',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** Message belongs to User */
Message.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

/** User has many Memories */
User.hasMany(Memory, {
  foreignKey: 'user_id',
  as: 'memories',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** Memory belongs to User */
Memory.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

/** User has many Tasks */
User.hasMany(Task, {
  foreignKey: 'user_id',
  as: 'tasks',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** Task belongs to User */
Task.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

/** User has many Goals */
User.hasMany(Goal, {
  foreignKey: 'user_id',
  as: 'goals',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** Goal belongs to User */
Goal.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

/** User has many Notifications */
User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** Notification belongs to User */
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

/** User has many Habits */
User.hasMany(Habit, {
  foreignKey: 'user_id',
  as: 'habits',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** Habit belongs to User */
Habit.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

/** Habit has many HabitLogs */
Habit.hasMany(HabitLog, {
  foreignKey: 'habit_id',
  as: 'logs',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

/** HabitLog belongs to Habit */
HabitLog.belongsTo(Habit, {
  foreignKey: 'habit_id',
  as: 'habit',
});

// -------------------------------------------------
//  Export Models & Sequelize Instance
// -------------------------------------------------

export {
  sequelize,
  User,
  Agent,
  UserPreference,
  UserToken,
  ActivityLog,
  Conversation,
  Message,
  Memory,
  Task,
  Goal,
  Notification,
  Habit,
  HabitLog,
};
