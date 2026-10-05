'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `agents` table.
   *
   * Every user owns exactly one personal AI agent (default name "Novi").
   * The agent is created automatically when a user registers.
   *
   * Wrapped in a transaction so that if any step fails
   * (e.g., index creation), the entire table creation
   * is rolled back cleanly.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'agents',
        {
          // -------------------------------------------------
          //  Primary Key
          // -------------------------------------------------
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the agent',
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
            comment: 'Foreign key referencing users table (each user has one agent)',
          },

          // -------------------------------------------------
          //  Agent Identity & Personality
          // -------------------------------------------------
          name: {
            type: Sequelize.STRING(100),
            allowNull: false,
            defaultValue: 'Novi',
            comment: 'Display name of the agent (customizable by the user)',
          },

          /** System personality / behavior configuration for the agent */
          personality: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
            comment: 'Agent personality / behavior configuration (system prompt overrides)',
          },

          /** Avatar key used by the frontend (e.g. "orb") */
          avatar: {
            type: Sequelize.STRING(50),
            allowNull: true,
            defaultValue: 'orb',
            comment: 'Avatar key used by the frontend',
          },

          /** Accent color used by the frontend */
          color: {
            type: Sequelize.STRING(20),
            allowNull: true,
            defaultValue: '#C26A44',
            comment: 'Accent color used by the frontend',
          },

          /** Whether the agent is currently active for the user */
          status: {
            type: Sequelize.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active',
            comment: 'Current agent status',
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

      // Unique index on user_id — each user has exactly one agent
      await queryInterface.addIndex('agents', ['user_id'], {
        unique: true,
        name: 'idx_agents_user_id_unique',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `agents` table.
   *
   * Also wrapped in a transaction for safe rollback.
   */
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('agents', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
