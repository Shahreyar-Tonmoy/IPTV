import mongoose, { Schema, models, model } from "mongoose";

const AdminUserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    displayName: { type: String, default: "", trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin"], default: "admin", index: true },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type AdminUserDocument = mongoose.InferSchemaType<typeof AdminUserSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AdminUserModel =
  models.AdminUser || model("AdminUser", AdminUserSchema);
