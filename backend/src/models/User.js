import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Staff member name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Excluded from query results by default for security
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['COUNSELLOR', 'COLLEGE_ADMIN', 'PLATFORM_ADMIN'],
        message: '{VALUE} is not a valid staff role'
      },
      default: 'COUNSELLOR'
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
      validate: {
        validator: function (val) {
          // PLATFORM_ADMIN can have null collegeId; COUNSELLOR and COLLEGE_ADMIN must belong to a college
          if (this.role === 'PLATFORM_ADMIN') return true;
          return val !== null && val !== undefined;
        },
        message: 'A valid collegeId is required for COUNSELLOR and COLLEGE_ADMIN roles'
      }
    },
    phone: {
      type: String,
      required: [true, 'Staff phone number is required'],
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDemo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes
userSchema.index({ collegeId: 1, role: 1 });

/**
 * Compare candidate password with stored bcrypt hash
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) {
    throw new Error('Password hash not loaded in user document');
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Static utility to hash plaintext password using bcryptjs (10 rounds)
 * @param {string} plainTextPassword
 * @returns {Promise<string>}
 */
userSchema.statics.hashPassword = async function (plainTextPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainTextPassword, salt);
};

export const User = mongoose.model('User', userSchema);
