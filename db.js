const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database instance
const db = new sqlite3.Database(path.join(__dirname, 'finance.db'));

// Initialize database
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          telegram_id INTEGER UNIQUE NOT NULL,
          username TEXT,
          first_name TEXT,
          last_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(new Error(`Database initialization error: ${err.message}`));
        } else {
          // Create transactions table with user reference
          db.run(`
            CREATE TABLE IF NOT EXISTS transactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
              amount REAL NOT NULL,
              currency TEXT DEFAULT 'USD',
              category TEXT,
              description TEXT,
              date TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            )
          `, (err) => {
            if (err) {
              console.error('Error creating transactions table:', err);
              reject(new Error(`Database initialization error: ${err.message}`));
            } else {
              console.log('Database initialized successfully');
              resolve();
            }
          });
        }
      });
    });
  });
}

// Get or create user based on Telegram user data
function getOrCreateUser(telegramUser) {
  return new Promise((resolve, reject) => {
    // First, try to find existing user
    const findStmt = db.prepare(`
      SELECT id FROM users WHERE telegram_id = ?
    `);
    
    findStmt.get([telegramUser.id], (err, row) => {
      if (err) {
        findStmt.finalize();
        reject(new Error(`Database error: ${err.message}`));
        return;
      }
      
      if (row) {
        // User exists
        findStmt.finalize();
        resolve(row.id);
      } else {
        // Create new user
        const createStmt = db.prepare(`
          INSERT INTO users (telegram_id, username, first_name, last_name)
          VALUES (?, ?, ?, ?)
        `);
        
        createStmt.run([
          telegramUser.id,
          telegramUser.username,
          telegramUser.first_name,
          telegramUser.last_name
        ], function(err) {
          createStmt.finalize();
          if (err) {
            reject(new Error(`Database error: ${err.message}`));
          } else {
            console.log(`User created with ID: ${this.lastID}`);
            resolve(this.lastID);
          }
        });
      }
    });
  });
}

// Save transaction to database
function saveTransaction(userId, transaction) {
  return new Promise((resolve, reject) => {
    // Validate transaction object
    if (!transaction || typeof transaction !== 'object') {
      reject(new Error('Invalid transaction object'));
      return;
    }

    // Validate required fields
    if (!transaction.type || !['expense', 'income'].includes(transaction.type)) {
      reject(new Error('Invalid transaction type. Must be "expense" or "income"'));
      return;
    }

    if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
      reject(new Error('Invalid transaction amount. Must be a positive number'));
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, currency, category, description, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      userId,
      transaction.type,
      transaction.amount,
      transaction.currency || 'USD',
      transaction.category,
      transaction.description,
      transaction.date || new Date().toISOString()
    ], function(err) {
      stmt.finalize();
      if (err) {
        console.error('Error saving transaction:', err);
        reject(new Error(`Database error: ${err.message}`));
      } else {
        console.log(`Transaction saved with ID: ${this.lastID}`);
        resolve(this.lastID);
      }
    });
  });
}

// Get all transactions
function getAllTransactions() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM transactions ORDER BY date DESC`, [], (err, rows) => {
      if (err) {
        console.error('Error fetching transactions:', err);
        reject(new Error(`Database error: ${err.message}`));
      } else {
        resolve(rows);
      }
    });
  });
}

// Get user transactions
function getUserTransactions(userId) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY date DESC
    `, [userId], (err, rows) => {
      if (err) {
        console.error('Error fetching user transactions:', err);
        reject(new Error(`Database error: ${err.message}`));
      } else {
        resolve(rows);
      }
    });
  });
}

// Get transaction statistics
function getTransactionStats() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions 
      GROUP BY type
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error fetching transaction stats:', err);
        reject(new Error(`Database error: ${err.message}`));
      } else {
        resolve(rows);
      }
    });
  });
}

// Get user transaction statistics
function getUserTransactionStats(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions 
      WHERE user_id = ?
      GROUP BY type
    `;
    
    db.all(query, [userId], (err, rows) => {
      if (err) {
        console.error('Error fetching user transaction stats:', err);
        reject(new Error(`Database error: ${err.message}`));
      } else {
        resolve(rows);
      }
    });
  });
}

// Get user's preferred currency based on their transactions
function getUserPreferredCurrency(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT currency, COUNT(*) as count
      FROM transactions 
      WHERE user_id = ?
      GROUP BY currency
      ORDER BY count DESC
      LIMIT 1
    `;
    
    db.get(query, [userId], (err, row) => {
      if (err) {
        console.error('Error fetching user preferred currency:', err);
        reject(new Error(`Database error: ${err.message}`));
      } else {
        // Default to RUB if no transactions or RUB is most used
        resolve(row ? row.currency : 'RUB');
      }
    });
  });
}

// Get user transaction statistics with currency
function getUserTransactionStatsWithCurrency(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        type,
        currency,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions 
      WHERE user_id = ?
      GROUP BY type, currency
    `;
    
    db.all(query, [userId], (err, rows) => {
      if (err) {
        console.error('Error fetching user transaction stats:', err);
        reject(new Error(`Database error: ${err.message}`));
      } else {
        resolve(rows);
      }
    });
  });
}

// Close database connection
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(new Error(`Error closing database: ${err.message}`));
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

module.exports = {
  initDatabase,
  saveTransaction,
  getAllTransactions,
  getUserTransactions,
  getTransactionStats,
  getUserTransactionStats,
  getUserTransactionStatsWithCurrency,
  getUserPreferredCurrency,
  closeDatabase,
  getOrCreateUser
};