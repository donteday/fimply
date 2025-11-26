/*
 * AI Processing Example
 * 
 * This file demonstrates how the DeepSeek AI processes natural language
 * financial messages and converts them to structured JSON data.
 */

// Example 1: Expense message
const expenseMessage = "I spent 25 dollars on lunch at McDonald's";

// AI would convert this to:
const expenseJson = {
  "type": "expense",
  "amount": 25,
  "currency": "USD",
  "category": "food",
  "description": "lunch at McDonald's"
};

console.log("Example 1 - Expense:");
console.log("Input:", expenseMessage);
console.log("Output:", JSON.stringify(expenseJson, null, 2));

console.log("\n" + "=".repeat(50) + "\n");

// Example 2: Income message
const incomeMessage = "Got my salary of 3500 euros this morning";

// AI would convert this to:
const incomeJson = {
  "type": "income",
  "amount": 3500,
  "currency": "EUR",
  "category": "salary",
  "description": "monthly salary"
};

console.log("Example 2 - Income:");
console.log("Input:", incomeMessage);
console.log("Output:", JSON.stringify(incomeJson, null, 2));

console.log("\n" + "=".repeat(50) + "\n");

// Example 3: Complex transaction
const complexMessage = "Paid $1200 for rent and $150 for electricity bill";

// AI would convert this to (splitting into separate transactions):
const complexJson1 = {
  "type": "expense",
  "amount": 1200,
  "currency": "USD",
  "category": "housing",
  "description": "rent payment"
};

const complexJson2 = {
  "type": "expense",
  "amount": 150,
  "currency": "USD",
  "category": "utilities",
  "description": "electricity bill"
};

console.log("Example 3 - Complex Transaction:");
console.log("Input:", complexMessage);
console.log("Output 1:", JSON.stringify(complexJson1, null, 2));
console.log("Output 2:", JSON.stringify(complexJson2, null, 2));

console.log("\n" + "=".repeat(50) + "\n");

console.log("These JSON structures are what gets stored in the SQLite database.");