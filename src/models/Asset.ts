import mongoose, { Schema, models, model } from "mongoose";

const AssetSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    url: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["channel-icon", "banner", "other"],
      default: "channel-icon",
      index: true,
    },
    alt: { type: String, default: "" },
  },
  { timestamps: true }
);

export type AssetDocument = mongoose.InferSchemaType<typeof AssetSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AssetModel = models.Asset || model("Asset", AssetSchema);
