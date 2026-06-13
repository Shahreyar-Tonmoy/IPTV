import mongoose, { Schema, models, model } from "mongoose";

const ChannelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    streamUrl: { type: String, required: true, trim: true },
    backupUrls: { type: [String], default: [] },
    logo: { type: String, default: "TV" },
    imageUrl: { type: String, default: "" },
    category: {
      type: String,
      enum: ["main", "highlights", "analysis", "local"],
      default: "main",
      index: true,
    },
    language: { type: String, default: "EN", index: true },
    quality: { type: String, enum: ["4K", "FHD", "HD", "SD"], default: "HD" },
    viewers: { type: Number, default: 0, min: 0 },
    isLive: { type: Boolean, default: true, index: true },
    currentMatch: { type: String, default: "" },
    region: { type: String, default: "Global", index: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

ChannelSchema.index({ isLive: 1, sortOrder: 1, createdAt: -1 });

export type ChannelDocument = mongoose.InferSchemaType<typeof ChannelSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ChannelModel =
  models.Channel || model("Channel", ChannelSchema);
