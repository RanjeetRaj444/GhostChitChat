import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatUser",
      required: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatUser",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
