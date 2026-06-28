import { Transaction } from "../models/transaction.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";

const getDashboardData = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const transactions = await Transaction.find({
        userId
    }).sort({ transactionDate: -1 });

    const totalIncome = transactions
        .filter(
            transaction =>
                transaction.expense_type === "income"
        )
        .reduce(
            (sum, transaction) =>
                sum + transaction.amount,
            0
        );

    const totalExpense = transactions
        .filter(
            transaction =>
                transaction.expense_type === "expense"
        )
        .reduce(
            (sum, transaction) =>
                sum + transaction.amount,
            0
        );

    const balance = totalIncome - totalExpense;

    const recentTransactions =
        transactions.slice(0, 5);

    return res.status(200).json(
        new apiResponse(
            200,
            {
                summary: {
                    totalIncome,
                    totalExpense,
                    balance,
                    totalTransactions:
                        transactions.length
                },
                recentTransactions
            },
            "Dashboard data fetched successfully"
        )
    );
});

const getCategoryBreakdown = asyncHandler(
    async (req, res) => {
        const breakdown =
            await Transaction.aggregate([
                {
                    $match: {
                        userId: req.user._id,
                        expense_type: "expense"
                    }
                },
                {
                    $group: {
                        _id: "$category",
                        totalAmount: {
                            $sum: "$amount"
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        category: "$_id",
                        expense_amount: "$totalAmount"
                    }
                },
                {
                    $sort: {
                        expense_amount: -1
                    }
                }
            ]);

        return res.status(200).json(
            new apiResponse(
                200,
                breakdown,
                "Category breakdown fetched successfully"
            )
        );
    }
);

const getMonthlyExpenses = asyncHandler(
    async (req, res) => {
        const monthlyExpenses =
            await Transaction.aggregate([
                {
                    $match: {
                        userId: req.user._id,
                        expense_type: "expense"
                    }
                },
                {
                    $group: {
                        _id: {
                            year: {
                                $year:
                                    "$transactionDate"
                            },
                            month: {
                                $month:
                                    "$transactionDate"
                            }
                        },
                        totalAmount: {
                            $sum: "$amount"
                        }
                    }
                },
                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1
                    }
                }
            ]);

        const formattedData =
            monthlyExpenses.map(item => ({
                year: item._id.year,
                month: item._id.month,
                expense_amount:
                    item.totalAmount
            }));

        return res.status(200).json(
            new apiResponse(
                200,
                formattedData,
                "Monthly expenses fetched successfully"
            )
        );
    }
);

export { getDashboardData , getCategoryBreakdown , getMonthlyExpenses };