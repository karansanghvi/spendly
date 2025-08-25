import React, { useEffect, useState } from 'react'
import { auth, db } from '../../firebase';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { Edit, Trash2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from "xlsx";

function Expenses() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [date, setDate] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);

  // Filter states
  const [filterCurrency, setFilterCurrency] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateRange, setFilterDateRange] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    setEditingExpense(null);
    setTitle("");
    setAmount("");
    setCurrency("");
    setDate("");
    setCategory("");
    setOtherCategory("");
    setNotes("");
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to add/edit expense");
      return;
    }

    try {
      if (editingExpense) {
        const expenseRef = doc(db, "expenses", editingExpense.id);
        await updateDoc(expenseRef, {
          title,
          amount: parseFloat(amount),
          currency,
          date,
          category: category === "others" ? otherCategory : category,
          notes,
        });
      } else {
        await addDoc(collection(db, "expenses"), {
          userId: user.uid,
          title,
          amount: parseFloat(amount),
          currency,
          date,
          category: category === "others" ? otherCategory : category,
          notes,
          createdAt: Timestamp.now(),
        });
      }

      closeModal();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "expenses"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expenseData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(expenseData);
    });

    return () => unsubscribe();
  }, []);

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setTitle(expense.title);
    setAmount(expense.amount);
    setCurrency(expense.currency);
    setDate(expense.date);
    setCategory(
      ["food","transport","medicine","groceries","rent","gifts","utilities","entertainment","education","household","clothing","network","travel","housing","emergency","tuition","gadgets","loan"].includes(expense.category)
        ? expense.category
        : "others"
    );
    setOtherCategory(
      ["food","transport","medicine","groceries","rent","gifts","utilities","entertainment","education","household","clothing","network","travel","housing","emergency","tuition","gadgets","loan"].includes(expense.category)
        ? ""
        : expense.category
    );
    setNotes(expense.notes || "");
    setIsOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;

    try {
      const expenseRef = doc(db, "expenses", deletingExpense.id);
      await deleteDoc(expenseRef);
      setDeletingExpense(null);
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  // Filter expenses based on filters
  const filteredExpenses = expenses.filter(expense => {
    const now = new Date();
    const expenseDate = new Date(expense.date);

    if (filterCurrency && expense.currency !== filterCurrency) return false;
    if (filterCategory && expense.category !== filterCategory) return false;
    if (filterDateRange) {
      const days = parseInt(filterDateRange);
      const pastDate = new Date();
      pastDate.setDate(now.getDate() - days);
      if (expenseDate < pastDate || expenseDate > now) return false;
    }
    if (filterDate) {
      const selectedDate = new Date(filterDate);
      if (
        expenseDate.getFullYear() !== selectedDate.getFullYear() ||
        expenseDate.getMonth() !== selectedDate.getMonth() ||
        expenseDate.getDate() !== selectedDate.getDate()
      ) {
        return false;
      }
    }
    return true;
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Calculate paginated data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const totalINR = filteredExpenses
    .filter(e => e.currency === "₹")
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const totalUSD = filteredExpenses
    .filter(e => e.currency === "$")
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const clearFilters = () => {
    setFilterCurrency("");
    setFilterCategory("");
    setFilterDateRange("");
    setFilterDate("");
  };

  const exportToExcel = () => {
    if (filteredExpenses.length === 0) {
      alert("No expenses to export!");
      return;
    }

    // Prepare data
    const data = filteredExpenses.map((exp) => ({
      Title: exp.title,
      Amount: exp.amount,
      Currency: exp.currency,
      Category: exp.category,
      Date: new Date(exp.date).toLocaleDateString(),
      Notes: exp.notes || "-",
    }));

    // Convert to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    // Generate excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, "expenses.xlsx");
  };

  return (
    <>
      <div className='px-4 md:px-10 pt-20'>
        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 w-full'>
          <div className='flex flex-col'>
            <h1 className='text-3xl font-bold text-black'>Expenses</h1>
            <div className="text-black text-xl font-semibold mt-1">
              Total: $ {totalUSD.toFixed(2)} | ₹ {totalINR.toFixed(2)}
            </div>
          </div>

          <button 
            className="bg-blue-500 text-white py-3 px-6 md:px-10 rounded-lg font-semibold text-xl hover:bg-blue-600 mt-4 md:mt-0"
            onClick={openModal}
          >
            Add Expense
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-start space-y-2 md:space-y-0 md:space-x-4 mb-4">
          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" className='text-black'>All Currencies</option>
            <option value="$" className='text-black'>USD ($)</option>
            <option value="₹" className='text-black'>INR (₹)</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" className='text-black'>All Categories</option>
            <option value="food" className="text-black">Food</option>
            <option value="transport" className="text-black">Transport</option>
            <option value="medicine" className="text-black">Medicine</option>
            <option value="groceries" className="text-black">Groceries</option>
            <option value="rent" className="text-black">Rent</option>
            <option value="gifts" className="text-black">Gifts</option>
            <option value="utilities" className="text-black">Utilities</option>
            <option value="entertainment" className="text-black">Entertainment</option>
            <option value="education" className="text-black">Education</option>
            <option value="household" className="text-black">Household</option>
            <option value="clothing" className="text-black">Clothing</option>
            <option value="network" className="text-black">Network</option>
            <option value="travel" className="text-black">Travel</option>
            <option value="housing" className="text-black">Housing</option>
            <option value="emergency" className="text-black">Emergency</option>
            <option value="tuition" className="text-black">Tuition</option>
            <option value="gadgets" className="text-black">Gadgets</option>
            <option value="loan" className="text-black">Loan</option>
            <option value="others" className="text-black">Others</option>
          </select>

          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" className='text-black'>All Dates</option>
            <option value="7" className='text-black'>Last 7 Days</option>
            <option value="20" className='text-black'>Last 20 Days</option>
            <option value="30" className='text-black'>Last 30 Days</option>
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button
            onClick={clearFilters}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
          >
            Clear Filters
          </button>

          <button
            onClick={exportToExcel}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
          >
            Download Excel
          </button>
        </div>

        {/* Expenses List */}
        <div className="overflow-x-auto mt-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-2xl shadow-lg bg-white border border-gray-300">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-500">
                  <tr>
                    <th className="px-4 py-3 text-left text-md font-semibold text-white">Title</th>
                    <th className="px-4 py-3 text-left text-md font-semibold text-white">Amount</th>
                    <th className="px-4 py-3 text-left text-md font-semibold text-white">Category</th>
                    <th className="px-4 py-3 text-left text-md font-semibold text-white">Date</th>
                    <th className="px-4 py-3 text-left text-md font-semibold text-white">Notes</th>
                    <th className="px-4 py-3 text-left text-md font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-800">
                  {currentExpenses.length > 0 ? (
                    currentExpenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="hover:bg-gray-100 transition duration-200"
                      >
                        <td className="px-4 py-2 text-sm">{expense.title}</td>
                        <td className="px-4 py-2 text-sm">{expense.currency} {expense.amount}</td>
                        <td className="px-4 py-2 text-sm">{expense.category}</td>
                        <td className="px-4 py-2 text-sm">{new Date(expense.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm">{expense.notes || "-"}</td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <Edit 
                              className="text-blue-500 cursor-pointer" 
                              size={20} 
                              onClick={() => handleEditExpense(expense)}
                            />
                            <Trash2 
                              className="text-red-500 cursor-pointer" 
                              size={20} 
                              onClick={() => setDeletingExpense(expense)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-4 text-gray-500 text-sm"
                      >
                        No expenses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-800 disabled:opacity-50"
                  >
                    Prev
                  </button>

                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => goToPage(index + 1)}
                      className={`px-3 py-1 rounded ${
                        currentPage === index + 1
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-800 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Modal For Adding Expense */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white border border-gray-300 rounded-2xl shadow-2xl w-full max-w-md max-h-[600px] p-6 relative text-gray-800 overflow-y-auto mb-10">
            <h2 className="text-2xl font-bold mb-4">{editingExpense ? "Edit Expense" : "Add Expense"}</h2>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold">Enter Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Expense Title"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Enter Amount:</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Amount"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Select Currency:</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">Currency</option>
                  <option value="$">United States Dollar ($)</option>
                  <option value="₹">Indian Rupee (₹)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold">Select Date:</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Select Category:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">Category</option>
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="medicine">Medicine</option>
                  <option value="groceries">Groceries</option>
                  <option value="rent">Rent</option>
                  <option value="gifts">Gifts</option>
                  <option value="utilities">Utilities</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="education">Education</option>
                  <option value="household">Household</option>
                  <option value="clothing">Clothing</option>
                  <option value="network">Network</option>
                  <option value="travel">Travel</option>
                  <option value="housing">Housing</option>
                  <option value="emergency">Emergency</option>
                  <option value="tuition">Tuition</option>
                  <option value="gadgets">Gadgets</option>
                  <option value="loan">Loan</option>
                  <option value="others">Others</option>
                </select>
              </div>

              {category === "others" && (
                <div>
                  <label className="block mb-1 font-semibold">Specify Category:</label>
                  <input
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                    type="text"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter Category Name"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block mb-1 font-semibold">Enter Notes:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Description"
                  rows={1}
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 border border-gray-300 text-gray-800 hover:bg-gray-300 transition"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                >
                  {editingExpense ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal For Deleting Expense */}
      {deletingExpense && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white border border-gray-300 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative text-gray-800">
            <h2 className="text-2xl font-bold mb-4">Delete Expense</h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete <strong>{deletingExpense.title}</strong>?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded bg-gray-200 border border-gray-300 text-gray-800 hover:bg-gray-300 transition"
                onClick={() => setDeletingExpense(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition"
                onClick={handleDeleteExpense}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default Expenses
