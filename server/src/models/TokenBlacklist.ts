import mongoose, { Schema } from "mongoose";

interface ITokenBlacklist {
  token: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  blacklistedAt: Date;
  reason: string;
  blacklistedBy?: mongoose.Types.ObjectId;
}

const tokenBlacklistSchema = new Schema<ITokenBlacklist>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    blacklistedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      required: true,
      enum: ["logout", "suspicious_activity", "manual", "token_rotation"],
    },
    blacklistedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient cleanup of expired tokens
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to check if token is blacklisted
tokenBlacklistSchema.statics.isTokenBlacklisted = async function (
  token: string
): Promise<boolean> {
  const blacklistedToken = await this.findOne({ token });
  return !!blacklistedToken;
};

// Static method to blacklist a token
tokenBlacklistSchema.statics.blacklistToken = async function (
  token: string,
  userId: mongoose.Types.ObjectId,
  expiresAt: Date,
  reason: string,
  blacklistedBy?: mongoose.Types.ObjectId
): Promise<void> {
  await this.create({
    token,
    userId,
    expiresAt,
    reason,
    blacklistedBy,
  });
};

// Static method to cleanup expired tokens (can be called periodically)
tokenBlacklistSchema.statics.cleanupExpiredTokens =
  async function (): Promise<number> {
    const result = await this.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount;
  };

export const TokenBlacklist = mongoose.model<ITokenBlacklist>(
  "TokenBlacklist",
  tokenBlacklistSchema
);
