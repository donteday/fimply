require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const { initDatabase, saveTransaction, getOrCreateUser, getUserTransactions, getUserTransactionStats, getUserPreferredCurrency } = require('./db');

// Initialize Telegram bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Set bot commands
bot.telegram.setMyCommands([
  { command: 'start', description: 'Start the bot and show welcome message' },
  { command: 'help', description: 'Show help information' },
  { command: 'menu', description: 'Show interactive menu' },
  { command: 'stats', description: 'View your financial statistics' },
  { command: 'transactions', description: 'View your recent transactions' }
]);

// Function to process user message with DeepSeek AI
async function processWithAI(message) {
  try {
    // Get current date for AI context
    const currentDate = new Date().toISOString().split('T')[0];
    const currentDateFormatted = new Date().toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const prompt = `
    Analyze the following financial message and extract the relevant information in JSON format.
    The message will be either an expense or income.
    
    Current date context: Today is ${currentDate} (${currentDateFormatted})
    
    Important date handling instructions:
    - If the message contains relative dates like "today", "yesterday", "позавчера" (day before yesterday), etc., convert them to actual dates
    - "вчера" or "yesterday" = yesterday's date (${new Date(Date.now() - 86400000).toISOString().split('T')[0]})
    - "позавчера" = day before yesterday's date (${new Date(Date.now() - 172800000).toISOString().split('T')[0]})
    - "today" = today's date (${currentDate})
    - If no date is mentioned, assume today's date (${currentDate})
    
    Message: "${message}"
    
    Extract the following information:
    - type: "expense" or "income"
    - amount: numeric value
    - currency: currency code (e.g., USD, EUR, RUB)
    - category: category of transaction (e.g., food, transport, salary)
    - description: brief description of the transaction
    - date: ISO format date string (YYYY-MM-DD) - very important!
    
    Respond ONLY with valid JSON in this exact format:
    {
      "type": "expense|income",
      "amount": number,
      "currency": "USD|EUR|RUB|etc",
      "category": "string",
      "description": "string",
      "date": "ISO date string"
    }
    
    If you cannot determine any field, use null for that field.
    If the message is not a financial transaction, respond with:
    {"error": "not_financial_message"}
    `;
    
    const response = await axios.post(process.env.DEEPSEEK_API_URL, {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a financial assistant that extracts structured data from natural language. Pay special attention to date handling - convert relative dates like 'yesterday', 'вчера', 'позавчера' to actual dates. Always respond with a valid ISO date string in the date field. The current date is provided in the user message. If the message is not related to financial transactions, respond with {\"error\": \"not_financial_message\"}."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 400
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15 second timeout
    });
    
    // Extract JSON from AI response
    const aiResponse = response.data.choices[0].message.content;
    
    // Handle case where AI indicates this isn't a financial message
    if (aiResponse.includes('"error": "not_financial_message"')) {
      throw new Error('NOT_FINANCIAL_MESSAGE');
    }
    
    // Try to parse JSON from response
    try {
      // Handle cases where AI might include extra text around JSON
      const jsonStart = aiResponse.indexOf('{');
      const jsonEnd = aiResponse.lastIndexOf('}') + 1;
      const jsonString = aiResponse.substring(jsonStart, jsonEnd);
      
      const parsed = JSON.parse(jsonString);
      
      // Validate required fields
      if (!parsed.type || !parsed.amount) {
        throw new Error('Missing required fields in AI response');
      }
      
      return parsed;
    } catch (parseError) {
      console.error('Error parsing AI JSON response:', parseError);
      console.error('AI Response:', aiResponse);
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('AI processing timed out');
    }
    if (error.response && error.response.status === 401) {
      throw new Error('Invalid DeepSeek API key');
    }
    if (error.response && error.response.status === 429) {
      throw new Error('DeepSeek API rate limit exceeded');
    }
    throw error;
  }
}

// Function to format transaction for display
function formatTransaction(transaction, currency = 'RUB') {
  // Handle date formatting properly
  let dateString = 'Unknown Date';
  if (transaction.date) {
    try {
      const date = new Date(transaction.date);
      if (!isNaN(date.getTime())) {
        dateString = date.toLocaleDateString('ru-RU');
      }
    } catch (e) {
      // If date parsing fails, use the raw date string
      dateString = transaction.date;
    }
  }
  
  const transactionCurrency = transaction.currency || currency;
  
  return `📝 ${transaction.type.toUpperCase()}
Amount: ${transaction.amount} ${transactionCurrency}
Category: ${transaction.category || 'N/A'}
Description: ${transaction.description || 'N/A'}
Date: ${dateString}`;
}

// Bot command handlers
bot.start(async (ctx) => {
  try {
    // Create or get user
    const userId = await getOrCreateUser(ctx.from);
    
    const welcomeMessage = `Welcome to your Financial Assistant Bot! 🤖💰
  
I help you track your expenses and income by analyzing your natural language messages.

Simply send me messages like:
• "I spent 50 dollars on groceries"
• "Got salary of 2000 euros today"
• "Paid 30 bucks for taxi"

Try it now!

To see all available commands, tap the menu button next to the text input field or type /help.`;
    
    ctx.reply(welcomeMessage);
  } catch (error) {
    console.error('Error in start handler:', error);
    ctx.reply('Sorry, I encountered an error. Please try again.');
  }
});

bot.help(async (ctx) => {
  try {
    // Create or get user
    const userId = await getOrCreateUser(ctx.from);
    
    const helpMessage = `🤖 *Financial Assistant Bot Help*

I can help you track your finances!

📝 *Commands:*
/start - Welcome message
/help - Show this help
/transactions - View your recent transactions
/stats - View your financial statistics
/menu - Show menu with all commands

💸 *How to log transactions:*
Simply send me messages like:
• "I spent 50 dollars on groceries"
• "Got salary of 2000 euros today"
• "Paid 30 bucks for taxi"

I'll analyze your message and store the transaction automatically!`;
    ctx.reply(helpMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in help handler:', error);
    ctx.reply('Sorry, I encountered an error. Please try again.');
  }
});

// Menu command
bot.command('menu', async (ctx) => {
  try {
    const menuMessage = `📝 *Available Commands:*

/start - Start the bot
/help - Show help information
/stats - View your financial statistics
/transactions - View your recent transactions

Send me a message about your expenses or income and I'll track it for you!`;
    
    ctx.reply(menuMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in menu handler:', error);
    ctx.reply('Sorry, I encountered an error. Please try again.');
  }
});

// View recent transactions
bot.command('transactions', async (ctx) => {
  try {
    // Create or get user
    const userId = await getOrCreateUser(ctx.from);
    
    const transactions = await getUserTransactions(userId);
    
    if (transactions.length === 0) {
      ctx.reply('No transactions found. Start by sending me details about your expenses or income!');
      return;
    }
    
    // Get user's preferred currency
    const preferredCurrency = await getUserPreferredCurrency(userId);
    
    // Show last 5 transactions
    const recentTransactions = transactions.slice(0, 5);
    let message = `📋 *Your Recent Transactions*\n\n`;
    
    recentTransactions.forEach((transaction, index) => {
      message += `${index + 1}. ${formatTransaction(transaction, preferredCurrency)}\n\n`;
    });
    
    ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    ctx.reply('Sorry, I encountered an error fetching your transactions.');
  }
});

// View financial statistics
bot.command('stats', async (ctx) => {
  try {
    // Create or get user
    const userId = await getOrCreateUser(ctx.from);
    
    const transactions = await getUserTransactions(userId);
    
    if (transactions.length === 0) {
      ctx.reply('No transactions found. Start by sending me details about your expenses or income!');
      return;
    }
    
    // Get user's preferred currency (default to RUB)
    const preferredCurrency = await getUserPreferredCurrency(userId);
    
    // Calculate statistics by currency
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
      const transactionCurrency = transaction.currency || 'RUB';
      // For simplicity, we'll convert everything to the preferred currency
      // In a real app, you'd want proper currency conversion rates
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        totalExpenses += transaction.amount;
      }
    });
    
    const balance = totalIncome - totalExpenses;
    
    const statsMessage = `📊 *Your Financial Statistics*

💰 Balance: ${balance.toFixed(2)} ${preferredCurrency}
📥 Total Income: ${totalIncome.toFixed(2)} ${preferredCurrency}
📤 Total Expenses: ${totalExpenses.toFixed(2)} ${preferredCurrency}`;

    ctx.reply(statsMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error calculating stats:', error);
    ctx.reply('Sorry, I encountered an error calculating your statistics.');
  }
});

// Handle text messages
bot.on('text', async (ctx) => {
  const message = ctx.message.text;
  
  // Ignore command messages
  if (message.startsWith('/')) return;
  
  try {
    // Create or get user
    const userId = await getOrCreateUser(ctx.from);
    
    // Process message with AI
    const processingMessage = await ctx.reply('🔄 Processing your transaction...');
    
    const transactionData = await processWithAI(message);
    
    // Check if this is a financial message
    if (transactionData.error === 'not_financial_message') {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMessage.message_id,
        null,
        '❌ This doesn\'t appear to be a financial transaction. Please send details about expenses or income.'
      );
      return;
    }
    
    // Validate transaction data
    if (!['expense', 'income'].includes(transactionData.type)) {
      throw new Error('Invalid transaction type');
    }
    
    if (typeof transactionData.amount !== 'number' || transactionData.amount <= 0) {
      throw new Error('Invalid transaction amount');
    }
    
    // Save to database
    await saveTransaction(userId, transactionData);
    
    // Get user's preferred currency for display
    const preferredCurrency = await getUserPreferredCurrency(userId);
    
    // Update processing message with confirmation
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMessage.message_id,
      null,
      `✅ Transaction recorded!\n\n${formatTransaction(transactionData, preferredCurrency)}`
    );
    
  } catch (error) {
    console.error('Error processing message:', error);
    
    let errorMessage = 'Sorry, I encountered an error processing your transaction. Please try again with a clearer description.';
    
    // Handle specific error types
    if (error.message === 'NOT_FINANCIAL_MESSAGE') {
      errorMessage = '❌ This doesn\'t appear to be a financial transaction. Please send details about expenses or income.';
    } else if (error.message === 'AI processing timed out') {
      errorMessage = '⏳ The AI took too long to respond. Please try again.';
    } else if (error.message === 'Invalid DeepSeek API key') {
      errorMessage = '🔐 Invalid API key. Please check your configuration.';
    } else if (error.message === 'DeepSeek API rate limit exceeded') {
      errorMessage = '🚦 Rate limit exceeded. Please try again later.';
    }
    
    // If we have a processing message, update it, otherwise send a new message
    try {
      await ctx.reply(errorMessage);
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
});

// Handle errors
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
  ctx.reply('Oops! Something went wrong. Please try again later.');
});

// Initialize database and start bot
initDatabase().then(() => {
  bot.launch();
  console.log('Bot started successfully!');
  console.log('Press Ctrl+C to stop the bot');
}).catch(error => {
  console.error('Error starting bot:', error);
});

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('Stopping bot...');
  bot.stop('SIGINT');
  process.exit(0);
});
process.once('SIGTERM', () => {
  console.log('Stopping bot...');
  bot.stop('SIGTERM');
  process.exit(0);
});