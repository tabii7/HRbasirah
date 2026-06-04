import { Navigate } from "react-router-dom";
import { API_BASE } from "../api/client";
import { formatExpenseAmount, formatExpenseDate } from "../utils/expenseFormat";

export function ExpensesListPage({ app }) {
  const {
    canViewExpensesSection,
    canViewAllExpenses,
    canApproveExpenses,
    expenses,
    expenseNotes,
    setExpenseNotes,
    updateExpenseStatus,
    pendingExpensesCount,
    openFilePreview,
  } = app;

  if (!canViewExpensesSection) return <Navigate to="/dashboard" replace />;

  const approvedTotal = expenses
    .filter((item) => item.status === "Approved")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const colCount = (canViewAllExpenses ? 1 : 0) + 7 + (canApproveExpenses ? 1 : 0);

  return (
    <section className="panel glass">
      <h3>{canViewAllExpenses ? "All Expenses" : "My Expenses"}</h3>
      {canViewAllExpenses ? (
        <p>
          {pendingExpensesCount} pending
          {expenses.length > 0 ? ` · ${formatExpenseAmount(approvedTotal)} approved total` : ""}
        </p>
      ) : (
        <p>Track status and admin notes for your submitted expenses.</p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {canViewAllExpenses && <th>Submitted by</th>}
              <th>Title</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Admin note</th>
              <th>Receipt</th>
              <th>Submitted at</th>
              {canApproveExpenses && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={colCount}>No expenses yet.</td>
              </tr>
            ) : (
              expenses.map((item) => {
                const receiptUrl = item.receiptPath ? `${API_BASE}${item.receiptPath}` : "";
                return (
                  <tr key={item.id}>
                    {canViewAllExpenses && (
                      <td>
                        {item.fullName}
                        {item.employeeId ? ` (${item.employeeId})` : ""}
                      </td>
                    )}
                    <td>{item.title}</td>
                    <td>{formatExpenseAmount(item.amount)}</td>
                    <td>{formatExpenseDate(item.expenseDate)}</td>
                    <td>
                      <span className={`status-badge status-${String(item.status || "pending").toLowerCase()}`}>
                        {item.status || "Pending"}
                      </span>
                    </td>
                    <td>{item.adminNote || "-"}</td>
                    <td>
                      {receiptUrl ? (
                        <a
                          href={receiptUrl}
                          onClick={(e) => {
                            e.preventDefault();
                            openFilePreview({
                              url: receiptUrl,
                              title: item.title,
                              subtitle: canViewAllExpenses ? item.fullName : "Receipt",
                            });
                          }}
                        >
                          View receipt
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{formatExpenseDate(item.createdAt?.slice(0, 10))}</td>
                    {canApproveExpenses && (
                      <td className="action-cell">
                        {item.status === "Pending" ? (
                          <>
                            <textarea
                              placeholder="Admin note (required)"
                              value={expenseNotes[item.id] || ""}
                              onChange={(e) => setExpenseNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                              rows={2}
                            />
                            <div className="action-buttons">
                              <button type="button" className="table-action-btn approve" onClick={() => updateExpenseStatus(item.id, "Approved")}>
                                Approve
                              </button>
                              <button type="button" className="table-action-btn reject" onClick={() => updateExpenseStatus(item.id, "Rejected")}>
                                Reject
                              </button>
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
