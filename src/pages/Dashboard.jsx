import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFE', '#FF6B6B'];

function Dashboard() {
  const [totalINR, setTotalINR] = useState(0);
  const [totalUSD, setTotalUSD] = useState(0);
  const [fullName, setFullName] = useState('');
  const [numTransactions, setNumTransactions] = useState(0);
  const [highestCategory, setHighestCategory] = useState('');
  const [lowestCategory, setLowestCategory] = useState('');
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchUserName = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) setFullName(userDoc.data().fullName);
    };
    fetchUserName();

    const q = query(collection(db, 'expenses'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, snapshot => {
      const expenseData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expenseData);

      let inr = 0;
      let usd = 0;
      let categoryTotals = {};

      expenseData.forEach(expense => {
        const amount = parseFloat(expense.amount) || 0;
        if (expense.currency === '₹') inr += amount;
        if (expense.currency === '$') usd += amount;
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + amount;
      });

      let maxCategory = '', minCategory = '';
      let maxAmount = -Infinity, minAmount = Infinity;
      for (const cat in categoryTotals) {
        const amt = categoryTotals[cat];
        if (amt > maxAmount) { maxAmount = amt; maxCategory = cat; }
        if (amt < minAmount) { minAmount = amt; minCategory = cat; }
      }

      setTotalINR(inr);
      setTotalUSD(usd);
      setNumTransactions(expenseData.length);
      setHighestCategory(maxCategory || '-');
      setLowestCategory(minCategory || '-');
    });

    return () => unsubscribe();
  }, []);

  // Prepare chart data
  const pieData = Object.entries(expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount || 0);
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  const lineData = expenses
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(e => ({ date: e.date, amount: parseFloat(e.amount) }));

  const barData = [
    { currency: 'INR (₹)', amount: expenses.filter(e => e.currency === '₹').reduce((sum, e) => sum + parseFloat(e.amount), 0) },
    { currency: 'USD ($)', amount: expenses.filter(e => e.currency === '$').reduce((sum, e) => sum + parseFloat(e.amount), 0) },
  ];

  const top5Expenses = [...expenses].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount)).slice(0, 5);

  return (
    <div className="px-4 md:px-10 pt-20 space-y-6 w-full mb-20">
      {fullName && <h1 className="text-3xl font-bold text-black">👋 Hello, {fullName}!</h1>}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-blue-500 text-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Total Expenses</h2>
          <p className="text-lg">$ {totalUSD.toFixed(2)} | ₹ {totalINR.toFixed(2)}</p>
        </div>
        <div className="bg-blue-500 text-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Number of Transactions</h2>
          <p className="text-lg">{numTransactions}</p>
        </div>
        <div className="bg-blue-500 text-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Highest Expense Category</h2>
          <p className="text-lg">{highestCategory}</p>
        </div>
        <div className="bg-blue-500 text-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Lowest Expense Category</h2>
          <p className="text-lg">{lowestCategory}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full h-[350px]">
          <h3 className="text-xl font-semibold mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ name }) => name}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full h-[350px]">
          <h3 className="text-xl font-semibold mb-4">Expense Trend</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full h-[350px]">
          <h3 className="text-xl font-semibold mb-4">Currency Breakdown</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="currency" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 Expenses */}
        <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto w-full">
          <h3 className="text-xl font-semibold mb-4">Top 5 Expenses</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-black">Title</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-black">Amount</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-black">Category</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-black">Date</th>
              </tr>
            </thead>
            <tbody>
              {top5Expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-100">
                  <td className="px-4 py-2 text-sm">{exp.title}</td>
                  <td className="px-4 py-2 text-sm">{exp.currency} {exp.amount}</td>
                  <td className="px-4 py-2 text-sm">{exp.category}</td>
                   <td className="px-4 py-2 text-sm">{exp.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
