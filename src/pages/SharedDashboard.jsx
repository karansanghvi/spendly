import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFE', '#FF6B6B'];

function SharedDashboard() {
  const { token } = useParams();
  const [ownerName, setOwnerName] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [totalINR, setTotalINR] = useState(0);
  const [totalUSD, setTotalUSD] = useState(0);
  const [numTransactions, setNumTransactions] = useState(0);
  const [highestCategory, setHighestCategory] = useState('');
  const [lowestCategory, setLowestCategory] = useState('');

  useEffect(() => {
  const fetchSharedData = async () => {
    // Get ownerId from token
    const q = query(collection(db, "sharedDashboards"), where("token", "==", token));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const owner = snapshot.docs[0].data().ownerId;

      // Fetch owner full name
      const userDoc = await getDoc(doc(db, "users", owner));
      if (userDoc.exists()) setOwnerName(userDoc.data().fullName);

      // Fetch expenses of owner
      const expensesSnapshot = await getDocs(
        query(collection(db, "expenses"), where("userId", "==", owner))
      );
      const expenseData = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expenseData);

      // Compute totals and category stats
      let inr = 0, usd = 0, categoryTotals = {};
      expenseData.forEach(exp => {
        const amt = parseFloat(exp.amount) || 0;
        if (exp.currency === "₹") inr += amt;
        if (exp.currency === "$") usd += amt;
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
      });

      let maxCat = '', minCat = '', maxAmt = -Infinity, minAmt = Infinity;
      for (const cat in categoryTotals) {
        if (categoryTotals[cat] > maxAmt) { maxAmt = categoryTotals[cat]; maxCat = cat; }
        if (categoryTotals[cat] < minAmt) { minAmt = categoryTotals[cat]; minCat = cat; }
      }

      setTotalINR(inr);
      setTotalUSD(usd);
      setNumTransactions(expenseData.length);
      setHighestCategory(maxCat || '-');
      setLowestCategory(minCat || '-');

    } else {
      alert("Invalid or expired link.");
    }
  };

  fetchSharedData();
}, [token]);

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

  const top5Expenses = [...expenses]
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0, 5);

  return (
    <div className="px-4 md:px-10 space-y-6 mb-20">
      {ownerName && <h1 className="text-3xl font-bold text-black">{ownerName}'s Shared Dashboard</h1>}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Expenses by Category</h3>
          <PieChart width={300} height={300}>
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
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Expense Trend</h3>
          <LineChart width={500} height={300} data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
          </LineChart>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Currency Breakdown</h3>
          <BarChart width={400} height={300} data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="currency" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#82ca9d" />
          </BarChart>
        </div>

        {/* Top 5 Expenses */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Top 5 Expenses</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Title</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Category</th>
              </tr>
            </thead>
            <tbody>
              {top5Expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-100">
                  <td className="px-4 py-2 text-sm">{exp.title}</td>
                  <td className="px-4 py-2 text-sm">{exp.currency} {exp.amount}</td>
                  <td className="px-4 py-2 text-sm">{exp.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SharedDashboard;
