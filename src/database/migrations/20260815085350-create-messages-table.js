'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `messages` table.
   *
   * Every message belongs to one conversation.
   * Roles: user, agent (Novi), system, tool.
   * Wrapped in a transaction so that if any step fails,
   * the entire table creation is rolled back cleanly.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'messages',
        {
          // -------------------------------------------------
          //  Primary Key
          // -------------------------------------------------
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the message',
          },

          // -------------------------------------------------
          //  Foreign Keys
          // -------------------------------------------------
          conversation_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'conversations',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Foreign key referencing conversations table',
          },

          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Foreign key referencing users table (message author)',
          },

          // -------------------------------------------------
          //  Message Fields
          // -------------------------------------------------
          role: {
            type: Sequelize.ENUM('user', 'agent', 'system', 'tool'),
            allowNull: false,
            defaultValue: 'user',
            comment: 'Role of the message author',
          },

          content: {
            type: Sequelize.TEXT,
            allowNull: false,
            comment: 'Message content',
          },

          /** Structured metadata (e.g. AI actions or token usage) */
          metadata: {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: null,
            comment: 'Structured metadata (e.g. AI actions or token usage)',
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

      // Index on conversation_id for message listing
      await queryInterface.addIndex('messages', ['conversation_id'], {
        name: 'idx_messages_conversation_id',
        transaction,
      });

      // Index on conversation_id + created_at for time-ordered history
      await queryInterface.addIndex('messages', ['conversation_id', 'created_at'], {
        name: 'idx_messages_conversation_created',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `messages` table.
   *
   * Also wrapped in a transaction for safe rollback.
   */
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('messages', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
