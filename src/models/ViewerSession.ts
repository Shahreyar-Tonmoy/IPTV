import mongoose, { Schema, models, model } from "mongoose";

const ViewerSessionSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    channelId: { type: String, required: true, index: true },
    userAgent: { type: String, default: "" },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

ViewerSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ViewerSessionSchema.index({ channelId: 1, expiresAt: 1 });

export type ViewerSessionDocument = mongoose.InferSchemaType<typeof ViewerSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ViewerSessionModel =
  models.ViewerSession || model("ViewerSession", ViewerSessionSchema);
