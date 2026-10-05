/**
 * ===========================================
 *  Token Service
 * ===========================================
 *
 * Manages token persistence, validation, and revocation
 * in the user_tokens database table. Supports database transactions.
 */

import { Op, Transaction } from 'sequelize';
import { UserToken } from '../models';
import { TokenType } from '../models/user-token.model';

/**
 * Saves a new token in the database.
 *
 * @param userId - ID of the user the token belongs to
 * @param token - Token string
 * @param type - Purpose/type of token (e.g. 'refresh_token')
 * @param expiresAt - Expiration Date
 * @param transaction - Optional Sequelize Transaction
 */
export const saveToken = async (
  userId: number,
  token: string,
  type: TokenType,
  expiresAt: Date,
  transaction?: Transaction
): Promise<UserToken> => {
  return UserToken.create(
    {
      user_id: userId,
      token,
      type,
      is_revoked: false,
      expires_at: expiresAt,
    },
    { transaction }
  );
};

/**
 * Finds an active (unrevoked and non-expired) token in the database.
 *
 * @param token - Token string to look up
 * @param type - Type of token
 * @param transaction - Optional Sequelize Transaction
 */
export const findValidToken = async (
  token: string,
  type: TokenType,
  transaction?: Transaction
): Promise<UserToken | null> => {
  return UserToken.findOne({
    where: {
      token,
      type,
      is_revoked: false,
      expires_at: {
        [Op.gt]: new Date(),
      },
    },
    transaction,
  });
};

/**
 * Revokes a specific token by setting is_revoked = true.
 *
 * @param token - Token string to revoke
 * @param transaction - Optional Sequelize Transaction
 */
export const revokeToken = async (
  token: string,
  transaction?: Transaction
): Promise<boolean> => {
  const [affectedRows] = await UserToken.update(
    { is_revoked: true },
    { where: { token }, transaction }
  );
  return affectedRows > 0;
};

/**
 * Revokes all tokens of a specific type for a user (e.g. during logout-all).
 *
 * @param userId - ID of the user
 * @param type - Optional token type filter
 * @param transaction - Optional Sequelize Transaction
 */
export const revokeAllUserTokens = async (
  userId: number,
  type?: TokenType,
  transaction?: Transaction
): Promise<number> => {
  const whereCondition: any = { user_id: userId, is_revoked: false };
  if (type) {
    whereCondition.type = type;
  }

  const [affectedRows] = await UserToken.update(
    { is_revoked: true },
    { where: whereCondition, transaction }
  );
  return affectedRows;
};
