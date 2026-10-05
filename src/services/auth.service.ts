/**
 * ===========================================
 *  Authentication Service
 * ===========================================
 *
 * Contains business logic for user registration,
 * login (email or mobile), token refresh, and logout.
 *
 * Registration provisions the user's personal agent
 * and default preferences inside the same transaction.
 * All database mutations are wrapped in Managed Transactions.
 */

import { Op } from 'sequelize';
import { Agent, User, UserPreference, sequelize } from '../models';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseExpiryToDate,
} from '../utils';
import { AppError } from '../middlewares/error.middleware';
import config from '../../config';
import * as tokenService from './token.service';
import { logActivity } from './activity-log.service';
import { toUserPayload, toAgentPayload } from '../utils/serializers';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Input for registering a new user */
export interface RegisterInput {
  name: string;
  mobile?: string;
  email: string;
  password: string;
  timezone?: string;
  ip_address?: string;
}

/** Input for user login */
export interface LoginInput {
  identifier: string;
  password: string;
  ip_address?: string;
}

/** Pair of tokens returned on auth success */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

/** Full auth response with user + agent + tokens */
export interface AuthResponse {
  user: ReturnType<typeof toUserPayload>;
  agent: ReturnType<typeof toAgentPayload> | null;
  tokens: TokenPair;
}

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Registers a new user account within a database transaction.
 *
 * The transaction provisions:
 *  1. The user record (password hashed by the model hook)
 *  2. The user's personal AI agent (default name "Novi")
 *  3. Default user preferences
 *  4. A persisted refresh token
 *  5. An activity log entry
 *
 * If any step fails, the whole registration is rolled back.
 */
export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  return sequelize.transaction(async (transaction) => {
    // Check for duplicate email
    const existingUser = await User.findOne({
      where: { email: input.email },
      transaction,
    });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Check for duplicate mobile number (when provided)
    if (input.mobile) {
      const existingMobile = await User.findOne({
        where: { mobile_number: input.mobile },
        transaction,
      });
      if (existingMobile) {
        throw new AppError('Mobile number already registered', 409);
      }
    }

    // Create user record (password hashed by beforeCreate hook)
    const user = await User.create(
      {
        full_name: input.name,
        email: input.email,
        mobile_number: input.mobile || null,
        password: input.password,
        timezone: input.timezone || null,
      },
      { transaction }
    );

    // Provision the user's personal AI agent
    const agent = await Agent.create(
      {
        user_id: user.id,
        name: 'Novi',
        avatar: 'orb',
        color: '#C26A44',
      },
      { transaction }
    );

    // Provision default preferences
    await UserPreference.create(
      {
        user_id: user.id,
        timezone: input.timezone || null,
      },
      { transaction }
    );

    // Generate tokens
    const payload = { id: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token to database
    const refreshExpiresAt = parseExpiryToDate(config.jwt.refreshExpiresIn);
    await tokenService.saveToken(
      user.id,
      refreshToken,
      'refresh_token',
      refreshExpiresAt,
      transaction
    );

    // Log registration activity
    await logActivity({
      userId: user.id,
      actionPerformed: 'USER_REGISTERED',
      ipAddress: input.ip_address,
      description: `User '${user.email}' registered account successfully`,
      transaction,
    });

    return {
      user: toUserPayload(user),
      agent: toAgentPayload(agent),
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  });
};

/**
 * Authenticates a user with email (or mobile number) and password.
 */
export const login = async (input: LoginInput): Promise<AuthResponse> => {
  return sequelize.transaction(async (transaction) => {
    // Find user by email OR mobile number (the "identifier")
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: input.identifier }, { mobile_number: input.identifier }],
      },
      transaction,
    });
    if (!user) {
      throw new AppError('Invalid email/mobile or password', 401);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      await logActivity({
        userId: user.id,
        actionPerformed: 'USER_LOGIN_FAILED',
        ipAddress: input.ip_address,
        description: `Failed login attempt for user '${user.email}' (invalid password)`,
        status: 'failed',
        transaction,
      });

      throw new AppError('Invalid email/mobile or password', 401);
    }

    // Check account status
    if (user.status !== 'active') {
      await logActivity({
        userId: user.id,
        actionPerformed: 'USER_LOGIN_BLOCKED',
        ipAddress: input.ip_address,
        description: `Blocked login attempt for user '${user.email}' (account status: ${user.status})`,
        status: 'failed',
        transaction,
      });

      throw new AppError(`Account is ${user.status}. Please contact support.`, 403);
    }

    // Update last login timestamp
    await user.update({ last_login: new Date() }, { transaction });

    // Generate tokens
    const payload = { id: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const refreshExpiresAt = parseExpiryToDate(config.jwt.refreshExpiresIn);
    await tokenService.saveToken(
      user.id,
      refreshToken,
      'refresh_token',
      refreshExpiresAt,
      transaction
    );

    await logActivity({
      userId: user.id,
      actionPerformed: 'USER_LOGIN',
      ipAddress: input.ip_address,
      description: `User '${user.email}' logged in successfully`,
      status: 'success',
      transaction,
    });

    const agent = await Agent.findOne({
      where: { user_id: user.id },
      transaction,
    });

    return {
      user: toUserPayload(user),
      agent: agent ? toAgentPayload(agent) : null,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  });
};

/**
 * Refreshes an access token using a valid refresh token (rotation).
 */
export const refreshToken = async (refreshTokenInput: string, ipAddress?: string): Promise<TokenPair> => {
  let decoded: { id: number; email: string };
  try {
    decoded = verifyRefreshToken(refreshTokenInput);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  return sequelize.transaction(async (transaction) => {
    const storedToken = await tokenService.findValidToken(
      refreshTokenInput,
      'refresh_token',
      transaction
    );
    if (!storedToken) {
      throw new AppError('Refresh token is invalid or has been revoked', 401);
    }

    // Rotate: revoke the used refresh token, issue a new pair
    await tokenService.revokeToken(refreshTokenInput, transaction);

    const payload = { id: decoded.id, email: decoded.email };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    const refreshExpiresAt = parseExpiryToDate(config.jwt.refreshExpiresIn);
    await tokenService.saveToken(
      decoded.id,
      newRefreshToken,
      'refresh_token',
      refreshExpiresAt,
      transaction
    );

    await logActivity({
      userId: decoded.id,
      actionPerformed: 'TOKEN_REFRESH',
      ipAddress,
      description: `User '${decoded.email}' refreshed authentication tokens`,
      transaction,
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  });
};

/**
 * Changes the authenticated user's password.
 *
 * Verifies the current password, hashes the new one (via the
 * model's beforeUpdate hook), and revokes every other refresh
 * token so previously-issued sessions lose the ability to refresh.
 * The current access token stays valid until it naturally expires.
 */
export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string,
  ipAddress?: string
): Promise<void> => {
  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isCurrentValid = await user.comparePassword(currentPassword);
    if (!isCurrentValid) {
      await logActivity({
        userId,
        actionPerformed: 'PASSWORD_CHANGE_FAILED',
        ipAddress,
        description: 'Failed password change attempt (incorrect current password)',
        status: 'failed',
        transaction,
      });
      throw new AppError('Current password is incorrect', 401);
    }

    // beforeUpdate hook re-hashes the password automatically
    await user.update({ password: newPassword }, { transaction });

    // Revoke all refresh tokens so old sessions cannot refresh
    await tokenService.revokeAllUserTokens(userId, undefined, transaction);

    await logActivity({
      userId,
      actionPerformed: 'PASSWORD_CHANGED',
      ipAddress,
      description: `User '${user.email}' changed their password`,
      status: 'success',
      transaction,
    });
  });
};

/**
 * Logs out a user by revoking their refresh token.
 */
export const logout = async (refreshTokenInput?: string, ipAddress?: string): Promise<void> => {
  if (refreshTokenInput) {
    let decoded: { id: number; email: string } | null = null;
    try {
      decoded = verifyRefreshToken(refreshTokenInput);
    } catch {
      // Continue even if JWT signature expired
    }

    await sequelize.transaction(async (transaction) => {
      await tokenService.revokeToken(refreshTokenInput, transaction);
      if (decoded) {
        await logActivity({
          userId: decoded.id,
          actionPerformed: 'USER_LOGOUT',
          ipAddress,
          description: `User '${decoded.email}' logged out successfully`,
          transaction,
        });
      }
    });
  }
};
