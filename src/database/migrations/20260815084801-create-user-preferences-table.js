'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `user_preferences` table.
   *
   * Stores one preferences row per user (timezone, language, theme,
   * notification toggles, AI preferences). JSON columns are used only
   * where a flexible shape is genuinely needed.
   *
   * Wrapped in a transaction so that if any step fails
   * (e.g., index creation), the entire table creation
   * is rolled back cleanly.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'user_preferences',
        {
          // -------------------------------------------------
          //  Primary Key
          // -------------------------------------------------
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the preference record',
          },

          // -------------------------------------------------
          //  Foreign Key — User Reference
          // -------------------------------------------------
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Foreign key referencing users table (one preferences row per user)',
          },

          // -------------------------------------------------
          //  Preferences
          // -------------------------------------------------
          timezone: {
            type: Sequelize.STRING(100),
            allowNull: true,
            defaultValue: null,
            comment: 'IANA timezone identifier of the user',
          },

          language: {
            type: Sequelize.STRING(10),
            allowNull: false,
            defaultValue: 'en',
            comment: 'Preferred language code',
          },

          theme: {
            type: Sequelize.ENUM('light', 'dark', 'system'),
            allowNull: false,
            defaultValue: 'system',
            comment: 'Preferred UI theme',
          },

          /** Whether memory features are enabled for the user */
          memory_enabled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether memory features are enabled',
          },

          /** Whether the agent should prefer concise answers */
          concise_answers: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether the agent should prefer concise answers',
          },

          /** Whether the daily briefing is enabled */
          daily_briefing_enabled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether the daily briefing is enabled',
          },

          /** Whether proactive AI suggestions are enabled */
          proactive_suggestions: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether proactive AI suggestions are enabled',
          },

          /** Whether in-app notifications are enabled */
          in_app_notifications: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether in-app notifications are enabled',
          },

          /** Whether browser notifications are enabled */
          browser_notifications: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether browser notifications are enabled',
          },

          /** Flexible AI preferences (e.g. model overrides) */
          ai_preferences: {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: null,
            comment: 'Flexible AI preferences (e.g. model overrides)',
          },

          // -------------------------------------------------
          //  Timestamps
          // -------------------------------------------------
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            comment: 'Record creation timestamp',
          },

          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            comment: 'Record last update timestamp',
          },
        },
        { transaction }
      );

      // Unique index on user_id — exactly one preferences row per user
      await queryInterface.addIndex('user_preferences', ['user_id'], {
        unique: true,
        name: 'idx_user_preferences_user_id_unique',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `user_preferences` table.
   *
   * Also wrapped in a transaction for safe rollback.
   */
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('user_preferences', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
