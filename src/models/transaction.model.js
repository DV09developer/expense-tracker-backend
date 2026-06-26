import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    exoense_type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    
    exoense_title: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      enum: [
        "Food",
        "Travel",
        "Shopping",
        "Bills",
        "Salary",
        "Entertainment",
        "Other",
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = mongoose.model(
  "Transaction",
  transactionSchema
);