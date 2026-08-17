import mongoose from "mongoose";

const entrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["income", "expense"], 
    required: true 
  },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  category: { type: String },
  payment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Payment"
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Transaction"
  },
  reference: { type: String },
}, { _id: false });

const summarySchema = new mongoose.Schema({
  byCategory: [{
    _id: false, 
    category: String, 
    income: Number,
    expense: Number, 
    count: Number
  },],
  byMethod: [{
    _id: false, 
    method: String, 
    total: Number, 
    count: Number
  },],
  largestIncome: { 
    amount: Number, 
    description: String, 
    transaction: mongoose.Schema.Types.ObjectId
  },
  largestExpense: { 
    amount: Number, 
    description: String, 
    transaction: mongoose.Schema.Types.ObjectId
  },
  netChange: Number,
  savingsRate: Number,
}, { _id: false });

const statementSchema = new mongoose.Schema({
  statementId: { 
    type: String, 
    unique: true, required: true 
  },

  year: { type: Number, required: true },
  month: { type: Number, min: 1, max: 12},

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  openingBalance: { type: Number, default: 0 },
  closingBalance: { type: Number, default: 0 },
  totalIncome: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  currency: { type: String, default: "UGX" },

  entries: [entrySchema],
  summary: summarySchema,

  status: {
    type: String, enum: ["draft", "final"], default: "draft"
  },
  generatedAt: {
    type: Date, default: Date.now 
  },
  sourceCount: {
    type: Number, default: 0
  },
}, { timestamps: true });

statementSchema.index({ startDate: -1 });
statementSchema.index(
  { year: 1, month: 1 },
  { unique: true, partialFilterExpression: { month: { $exists: true } }}
);

statementSchema.virtual("period").get(function () {
  if (!this.month) return String(this.year);
  return new Date(this.year, this.month - 1 )
    .toLocaleString("en-US", { month: "long", year: "numeric" });
});
statementSchema.set("toJSON", { virtuals: true });
statementSchema.set("toObject", { virtuals: true });

statementSchema.methods.validateIntegrity = function () {
  const problems = [];

  const income = this.entries
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + e.amount, 0);
  const expense = this.entries
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + e.amount, 0);

  if (Math.round(income) !== Math.round(this.totalIncome))
    problems.push(
      `totalIncome ${this.totalIncome} != sum of income entries ${income}`
    );
  if (Math.round(expense) !== Math.round(this.totalExpenses))
    problems.push(
      `totalExpenses ${this.totalExpenses} != sum of expense entries ${expense}`
    );
  
  const expectedClose = this.openingBalance + income - expense;
  if (Math.round(expectedClose) !== Math.round(this.closingBalance))
    problems.push(
      `closingBalance ${this.closingBalance} != opening + income - expense ${expectedClose}`
    );

  let running = this.openingBalance;
  for (const e of this.entries) {
    running += e.type === "income" ? e.amount : -e.amount;
    if (Math.round(running) !== Math.round(e.balance)) {
      problems.push(
        `running balane broke at ${e.reference}: Expected ${running}, got ${e.balance}`
      );
      break;
    }
  }

  return { valid: problems.push.length === 0, problems };
};

statementSchema.methods.finalize = function () {
  const { valid, problems } = this.validateIntegrity();
  if(!valid)
    throw new Error(
      `Can't finalize ${this.statementId}: ${problems.join(" ")}`
    );
    this.status = 'final';
    return this.save();
};


export default mongoose.model("Statement", statementSchema);
