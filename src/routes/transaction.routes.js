import { Router } from "express";

import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller.js";

import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Create Transaction
router
  .route("/")
  .post(verifyAccessToken, createTransaction);

// Get All Transactions
router
  .route("/")
  .get(verifyAccessToken, getTransactions);

// Update Transaction
router
  .route("/:transactionId")
  .patch(verifyAccessToken, updateTransaction);

// Delete Transaction
router
  .route("/:transactionId")
  .delete(verifyAccessToken, deleteTransaction);

export default router;


// import { verifyAccessToken } from "../middlewares/auth.middleware.js";

// const router = Router();

// router.use(verifyAccessToken);

// router
//   .route("/")
//   .post(createTransaction)
//   .get(getTransactions);

// router
//   .route("/:transactionId")
//   .patch(updateTransaction)
//   .delete(deleteTransaction);