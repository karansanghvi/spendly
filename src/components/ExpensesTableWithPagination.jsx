import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ExpensesTableWithPagination({ expenses, itemsPerPage }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(expenses.length / itemsPerPage);

  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentExpenses = expenses.slice(startIdx, startIdx + itemsPerPage);

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(expenses.map(e => ({
      Title: e.title,
      Amount: e.amount,
      Currency: e.currency,
      Category: e.category,
      Date: new Date(e.date).toLocaleDateString(),
      Notes: e.notes || "-"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "Expenses.xlsx");
  };

  return (
    <div className="overflow-x-auto max-h-[60vh]">
      <div className="flex justify-end mb-2">
        <button
          onClick={downloadExcel}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition text-sm"
        >
          Download Excel
        </button>
      </div>
      <table className="min-w-full divide-y divide-gray-200 table-auto">
        <thead className="bg-blue-500">
          <tr>
            <th className="px-4 py-2 text-left text-white">Title</th>
            <th className="px-4 py-2 text-left text-white">Amount</th>
            <th className="px-4 py-2 text-left text-white">Currency</th>
            <th className="px-4 py-2 text-left text-white">Category</th>
            <th className="px-4 py-2 text-left text-white">Date</th>
            <th className="px-4 py-2 text-left text-white">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-gray-800">
          {currentExpenses.map(exp => (
            <tr key={exp.id} className="hover:bg-gray-100">
              <td className="px-4 py-2">{exp.title}</td>
              <td className="px-4 py-2">{exp.amount}</td>
              <td className="px-4 py-2">{exp.currency}</td>
              <td className="px-4 py-2">{exp.category}</td>
              <td className="px-4 py-2">{new Date(exp.date).toLocaleDateString()}</td>
              <td className="px-4 py-2">{exp.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2 flex-wrap">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
