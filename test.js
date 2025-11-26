// Simple test script to verify components work correctly
const { initDatabase, saveTransaction, getUserTransactions, getOrCreateUser } = require('./db');

async function runTests() {
  console.log('🧪 Running tests...\n');
  
  try {
    // Test 1: Database initialization
    console.log('1. Testing database initialization...');
    await initDatabase();
    console.log('✅ Database initialized successfully\n');
    
    // Test 2: Create a test user
    console.log('2. Testing user creation...');
    
    const testUser = {
      id: 123456789,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User'
    };
    
    const userId = await getOrCreateUser(testUser);
    console.log(`✅ User created/identified with ID: ${userId}\n`);
    
    // Test 3: Save sample transactions for the user
    console.log('3. Testing transaction saving...');
    
    const sampleExpense = {
      type: 'expense',
      amount: 50.99,
      currency: 'USD',
      category: 'groceries',
      description: 'Weekly grocery shopping',
      date: new Date().toISOString()
    };
    
    const sampleIncome = {
      type: 'income',
      amount: 2500.00,
      currency: 'USD',
      category: 'salary',
      description: 'Monthly salary',
      date: new Date().toISOString()
    };
    
    const expenseId = await saveTransaction(userId, sampleExpense);
    console.log(`✅ Expense saved with ID: ${expenseId}`);
    
    const incomeId = await saveTransaction(userId, sampleIncome);
    console.log(`✅ Income saved with ID: ${incomeId}\n`);
    
    // Test 4: Retrieve user transactions
    console.log('4. Testing user transaction retrieval...');
    const transactions = await getUserTransactions(userId);
    console.log(`✅ Retrieved ${transactions.length} user transactions\n`);
    
    // Display sample transactions
    console.log('Sample transactions:');
    transactions.slice(0, 2).forEach((transaction, index) => {
      console.log(`${index + 1}. ${transaction.type}: ${transaction.amount} ${transaction.currency} (${transaction.category})`);
    });
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();