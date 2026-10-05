'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `conversations` table.
   *
   * Every conversation belongs to exactly one user and
   * exactly one agent. Wrapped in a transaction so that
   * if any step fails, the entire table creation is
   * rolled back cleanly.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'conversations',
        {
          // -------------------------------------------------
          //  Primary Key
          // -------------------------------------------------
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the conversation',
          },

          // -------------------------------------------------
          //  Foreign Keys
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
            comment: 'Foreign key referencing users table (owning user)',
          },

          agent_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'agents',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Foreign key referencing agents table (conversing agent)',
          },

          // -------------------------------------------------
          //  Conversation Fields
          // -------------------------------------------------
          title: {
            type: Sequelize.STRING(255),
            allowNull: false,
            defaultValue: 'New conversation',
            comment: 'Conversation title',
          },

          status: {
            type: Sequelize.ENUM('active', 'archived'),
            allowNull: false,
            defaultValue: 'active',
            comment: 'Current conversation status',
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

      // Index on user_id for per-user conversation listings
      await queryInterface.addIndex('conversations', ['user_id'], {
        name: 'idx_conversations_user_id',
        transaction,
      });

      // Index on agent_id for agent conversation listings
      await queryInterface.addIndex('conversations', ['agent_id'], {
        name: 'idx_conversations_agent_id',
        transaction,
      });

      // Index on user_id + updated_at for "recent conversations" queries
      await queryInterface.addIndex('conversations', ['user_id', 'updated_at'], {
        name: 'idx_conversations_user_updated',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `conversations` table.
   *
   * Also wrapped in a transaction for safe rollback.
   */
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('conversations', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
