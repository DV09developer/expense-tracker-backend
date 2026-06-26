import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Transaction } from "../models/transaction.model.js";
import { apiResponse } from "../utils/apiResponse.js";

const getTransactions = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({
        userId,
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalTransactions = await Transaction.countDocuments({userId});

    return res.status(200).json(
        new apiResponse(
            200,
            {
                transactions,
                pagination: {
                    page,
                    limit,
                    totalTransactions,
                    totalPages: Math.ceil(
                        totalTransactions / limit
                    ),
                },
            },
            "Transactions fetched successfully"
        )
    );
});

const createTransaction = asyncHandler(async (req, res) => {
  const {
    amount,
    description,
    expense_type,
    expense_title,
  } = req.body;

  const userId = req.user?._id;

  if (!userId) {
    throw new apiError(401, "Unauthorized");
  }

  if (!amount || Number(amount) <= 0) {
    throw new apiError(400, "Please enter a valid amount");
  }

  if (!expense_type?.trim()) {
    throw new apiError(400, "Expense type is required");
  }

  if (!expense_title?.trim()) {
    throw new apiError(400, "Expense title is required");
  }

  const transaction = await Transaction.create({
    userId,
    amount,
    description,
    expense_type,
    expense_title,
  });

  return res.status(201).json(
    new apiResponse(201, transaction, "Transaction created successfully")
  );
});


const updateTransaction = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;

    const {
        amount,
        description,
        expense_type,
        expense_title
    } = req.body;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
        throw new apiError(404, "Transaction not found");
    }

    // Ensure the logged-in user owns this transaction
    if (
        transaction.userId.toString() !== req.user._id.toString()
    ) {
        throw new apiError(403, "You are not authorized to update this transaction");
    }

    if (amount !== undefined) {
        if (amount <= 0) {
            throw new apiError(400, "Amount must be greater than 0");
        }

        transaction.amount = amount;
    }

    if (description !== undefined) {
        transaction.description = description;
    }

    if (expense_type !== undefined) {
        transaction.expense_type = expense_type;
    }

    if (expense_title !== undefined) {
        transaction.expense_title = expense_title;
    }

    await transaction.save();

    return res.status(200).json(
        new apiResponse(
            200,
            transaction,
            "Transaction updated successfully"
        )
    );
});

const deleteTransaction = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
        throw new apiError(
            404,
            "Transaction not found"
        );
    }

    // Verify ownership
    if (
        transaction.userId.toString() !==
        req.user._id.toString()
    ) {
        throw new apiError(
            403,
            "You are not authorized to delete this transaction"
        );
    }

    await Transaction.findByIdAndDelete(transactionId);

    return res.status(200).json(
        new apiResponse(
            200,
            null,
            "Transaction deleted successfully"
        )
    );
});

export { getTransactions, createTransaction, updateTransaction, deleteTransaction };