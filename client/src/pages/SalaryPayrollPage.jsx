import { ArrowUpRight, FileDown } from "lucide-react";
import { Navigate, NavLink } from "react-router-dom";

export function SalaryPayrollPage({ app }) {
  const {
    canManagePayroll,
    employees,
    salaryCalcForm,
    setSalaryCalcForm,
    loadSalaryReport,
    generateSalarySlip,
    payrollLoading,
    payrollPreview,
    monthlyReport,
  } = app;

  if (!canManagePayroll) return <Navigate to="/dashboard" replace />;

  return (
    <section className="panel glass">
      <div className="page-head" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>Payroll & reports</h3>
          <p style={{ margin: "6px 0 0", opacity: 0.85 }}>View monthly payroll and generate slips when ready.</p>
        </div>
        <NavLink to="/salary-slips" className="quick-action" style={{ textDecoration: "none", width: "auto", padding: "10px 14px" }}>
          <FileDown size={18} />
          <span>All slips</span>
          <ArrowUpRight size={16} />
        </NavLink>
      </div>
      <div className="grid two" style={{ marginTop: 20 }}>
        <div className="field">
          <label>User (for slip &amp; single summary)</label>
          <select value={salaryCalcForm.employeeUserId} onChange={(e) => setSalaryCalcForm({ ...salaryCalcForm, employeeUserId: e.target.value })}>
            <option value="">Optional — leave empty for company report only</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} ({emp.employeeId})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Month *</label>
          <input type="month" value={salaryCalcForm.month} onChange={(e) => setSalaryCalcForm({ ...salaryCalcForm, month: e.target.value })} />
        </div>
        <div className="field">
          <label>Monthly Salary</label>
          <input type="number" min="1" step="0.01" value={salaryCalcForm.totalSalary} readOnly />
        </div>
        <div className="field" style={{ alignSelf: "end", display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={loadSalaryReport} disabled={payrollLoading || !salaryCalcForm.month}>
            {payrollLoading ? "Loading…" : "View report"}
          </button>
          <button type="button" onClick={generateSalarySlip} disabled={!salaryCalcForm.employeeUserId || !salaryCalcForm.month}>
            Generate salary slip
          </button>
        </div>
        <p style={{ gridColumn: "1 / -1", margin: 0, fontSize: 13, opacity: 0.85 }}>
          View report loads payroll only (no file created). Generate salary slip creates the downloadable document on All slips.
        </p>
      </div>
      {salaryCalcForm.employeeUserId && payrollPreview && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th colSpan={2}>Selected user summary ({payrollPreview.month})</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Employee</td>
                <td>
                  {payrollPreview.employee.fullName} ({payrollPreview.employee.employeeId})
                </td>
              </tr>
              <tr>
                <td>As of date</td>
                <td>{payrollPreview.asOfDate}</td>
              </tr>
              <tr>
                <td>Pay from</td>
                <td>
                  {payrollPreview.dutyStart}
                  {payrollPreview.joinedDate ? ` (joined ${String(payrollPreview.joinedDate).slice(0, 10)})` : ""}
                </td>
              </tr>
              <tr>
                <td>Billable days (this month)</td>
                <td>
                  {payrollPreview.eligibleDaysInMonth} / {payrollPreview.daysInMonth}
                </td>
              </tr>
              <tr>
                <td>Contract monthly salary</td>
                <td>{(payrollPreview.fullMonthSalary ?? payrollPreview.grossSalary).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Prorated gross (this month)</td>
                <td>{payrollPreview.grossSalary.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Deduction (unpaid leave, till date)</td>
                <td>{payrollPreview.unpaidLeaveDeductionTillDate.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Salary payable (till date)</td>
                <td>{payrollPreview.netSalaryTillDate.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Projected net (end of month)</td>
                <td>{payrollPreview.netSalary.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {monthlyReport && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Month</th>
                <th>As of</th>
                <th>Salary to pay</th>
              </tr>
            </thead>
            <tbody>
              {monthlyReport.rows.map((row) => (
                <tr key={row.employeeUserId}>
                  <td>
                    {row.fullName} ({row.employeeId})
                  </td>
                  <td>{row.month}</td>
                  <td>{row.asOfDate}</td>
                  <td>{Number(row.netSalaryTillDate).toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <strong>Total ({monthlyReport.totalEmployees} employees)</strong>
                </td>
                <td>{monthlyReport.month}</td>
                <td>{monthlyReport.asOfDate}</td>
                <td>
                  <strong>{Number(monthlyReport.totals.netSalaryToPay).toFixed(2)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
          {payrollLoading && <p style={{ marginTop: 10 }}>Loading report…</p>}
        </div>
      )}
    </section>
  );
}
