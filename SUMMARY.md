# Finner Bot - Financial Assistant Telegram Bot

## Project Summary

We have successfully created a financial assistant Telegram bot that uses AI (DeepSeek) to process natural language financial messages and automatically track expenses and income. The bot now supports multiple users with individual transaction tracking, improved date handling with current date context, currency-aware balance display, and Telegram built-in commands menu.

## Key Features Implemented

1. **Telegram Bot Interface**
   - Built with Telegraf framework
   - Supports natural language input
   - Provides user-friendly commands (/start, /help, /transactions, /stats, /menu)
   - Telegram built-in commands menu for easy navigation

2. **AI-Powered Processing**
   - Integrates with DeepSeek AI API
   - Converts natural language to structured JSON data
   - Automatically categorizes transactions
   - Handles various currencies
   - Smart date interpretation with current date context (yesterday, today, etc.)

3. **Multi-User Database Storage**
   - SQLite database for local storage
   - Users table to track Telegram users
   - Transactions linked to individual users
   - Structured schema with validation
   - Currency-aware storage and retrieval

4. **Financial Analytics**
   - User-specific transaction history viewing
   - Financial statistics calculation per user in preferred currency
   - Balance tracking with proper currency formatting

5. **Error Handling & Validation**
   - Comprehensive error handling
   - Input validation
   - Graceful failure responses
   - Robust date parsing

## Technical Architecture

- **Backend**: Node.js
- **Framework**: Telegraf
- **AI Service**: DeepSeek API
- **Database**: SQLite
- **Deployment**: Local or cloud hosting

## How to Use

1. Set up your Telegram bot token and DeepSeek API key in the .env file
2. Install dependencies with `npm install`
3. Start the bot with `npm start`
4. Interact with the bot through Telegram:
   - Send natural language messages about expenses/income
   - Use commands to view transactions and statistics
   - Use relative dates like "yesterday", "вчера", etc.
   - When no date is specified, the bot assumes today's date
   - Use the built-in Telegram commands menu for quick access to all features

## Example Interactions

- "I spent 50 dollars on groceries"
- "Got salary of 2000 euros today"
- "Paid 30 bucks for taxi yesterday"
- "Вчера потратил 500 рублей на обед" (Yesterday I spent 500 rubles on lunch)
- "Потратил на такси 1200 рублей" (Spent 1200 rubles on taxi - assumes today)

The bot will automatically process these messages, extract the financial data, store it in the database linked to your user account, and provide confirmation with proper currency formatting.

## Files Created

1. `index.js` - Main bot application
2. `db.js` - Database operations with multi-user support
3. `test.js` - Component testing
4. `ai-example.js` - AI processing examples
5. `.env` - Configuration file
6. `package.json` - Project dependencies
7. `README.md` - Project documentation
8. `architecture.md` - System architecture
9. `SUMMARY.md` - This file

## Database Schema

The bot now uses a SQLite database with two tables:

### Users Table
Stores information about each Telegram user who interacts with the bot.

### Transactions Table
Stores financial transactions linked to individual users via foreign key relationship.

## Troubleshooting

If you encounter a "401: Bot Token is required" error:
1. Make sure your `.env` file exists and contains a valid `TELEGRAM_BOT_TOKEN`
2. Verify that the bot token is correct by checking it with [@BotFather](https://t.me/BotFather) on Telegram
3. Ensure that the `.env` file is in the root directory of the project
4. Restart the bot after making changes to the `.env` file

## Future Enhancements

1. Add support for recurring transactions
2. Implement budget tracking features
3. Add data export capabilities (CSV, PDF)
4. Create web dashboard for data visualization
5. Implement data backup and restore
6. Add more advanced analytics and reporting
7. Support for shared expenses between users
8. Proper currency conversion rates

This bot provides a solid foundation for a personal finance assistant that can be extended with additional features as needed.