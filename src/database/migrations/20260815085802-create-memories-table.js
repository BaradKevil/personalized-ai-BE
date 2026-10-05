'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `memories` table.
   *
   * Stores the user's personal memory. Memories belong to
   * the user and are only created from explicit user input
   * or high-value context — never from casual conversation.
   *
   * Wrapped in a transaction so that if any step fails
   * (e.g., index creation), the entire table creation
   * is rolled back cleanly.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'memories',
        {
          // -------------------------------------------------
          //  Primary Key
          // -------------------------------------------------
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the memory',
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
            comment: 'Foreign key referencing users table (owning user)',
          },

          // -------------------------------------------------
          //  Memory Fields
          // -------------------------------------------------
          type: {
            type: Sequelize.STRING(50),
            allowNull: false,
            defaultValue: 'General',
            comment: 'Category/type of the memory (e.g. Preferences, Work, Important)',
          },

          content: {
            type: Sequelize.TEXT,
            allowNull: false,
            comment: 'The memory content',
          },

          importance: {
            type: Sequelize.ENUM('low', 'medium', 'high'),
            allowNull: false,
            defaultValue: 'medium',
            comment: 'Importance level of the memory',
          },

          /** Where the memory came from (user, conversation, settings) */
          source: {
            type: Sequelize.STRING(100),
            allowNull: true,
            defaultValue: null,
            comment: 'Source of the memory (e.g. conversation, settings)',
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

      // Index on user_id for per-user memory queries
      await queryInterface.addIndex('memories', ['user_id'], {
        name: 'idx_memories_user_id',
        transaction,
      });

      // Index on user_id + created_at for time-ordered listings
      await queryInterface.addIndex('memories', ['user_id', 'created_at'], {
        name: 'idx_memories_user_created',
        transaction,
      });

      // Index on type for category filtering
      await queryInterface.addIndex('memories', ['type'], {
        name: 'idx_memories_type',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `memories` table.
   *
   * Also wrapped in a transaction for safe rollback.
   */
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('memories', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
