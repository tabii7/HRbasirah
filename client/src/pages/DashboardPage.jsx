import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CircleUserRound,
  Clock3,
  FileDown,
  ReceiptText,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export function DashboardPage({ app }) {
  const {
    user,
    employees,
    leaves,
    slips,
    isManagement,
    canManageEmployees,
    canManageLeaves,
    isEmployee,
    canViewSalarySection,
    canManagePayroll,
    canViewExpensesSection,
    canSubmitExpenses,
    canViewAllExpenses,
    expenses,
    pendingExpensesCount,
    pendingLeavesCount,
    approvedLeavesCount,
  } = app;

  return (
    <div className="dashboard-page">
      <section className="panel glass dashboard-hero">
        <div>
          <p className="eyebrow">Operations Overview</p>
          <h3>Welcome back, {user.fullName}</h3>
          <p>
            {isManagement
              ? "Manage assigned operations from one place."
              : "Track your requests, documents, and work profile."}
            {isManagement && employees.length === 0 && (
              <> Add users under <strong>Employees → Add user</strong> to populate the dashboard.</>
            )}
          </p>
        </div>
        <div className="hero-chip">
          <Clock3 size={16} />
          <span>Today: {new Date().toLocaleDateString()}</span>
        </div>
      </section>

      <div className="stats">
        <article className="card metric-card">
          <div className="metric-head">
            <CircleUserRound size={18} />
            <span>{isManagement ? "People" : "Designation"}</span>
          </div>
          <strong>{isManagement ? employees.length : (user.designation || user.role).toUpperCase()}</strong>
          <small>{isManagement ? "Total users registered" : "Your current role title"}</small>
        </article>
        <article className="card metric-card">
          <div className="metric-head">
            <BriefcaseBusiness size={18} />
            <span>Leaves</span>
          </div>
          <strong>{leaves.length}</strong>
          <small>{pendingLeavesCount} pending approvals</small>
        </article>
        <article className="card metric-card">
          <div className="metric-head">
            <FileDown size={18} />
            <span>Salary Slips</span>
          </div>
          <strong>{slips.length}</strong>
          <small>Documents available</small>
        </article>
        <article className="card metric-card">
          <div className="metric-head">
            <ShieldCheck size={18} />
            <span>{isManagement ? "Access" : "Access Level"}</span>
          </div>
          <strong>{(user.designation || user.role).toUpperCase()}</strong>
          <small>{approvedLeavesCount} approved leaves</small>
        </article>
      </div>

      <section className="dashboard-grid">
        <article className="panel glass">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            {canManageEmployees && (
              <NavLink to="/employees/list" className="quick-action">
                <Users size={18} />
                <span>Manage Users</span>
                <ArrowUpRight size={16} />
              </NavLink>
            )}
            {(canManageLeaves || isEmployee) && (
              <NavLink to="/leaves" className="quick-action">
                <CalendarDays size={18} />
                <span>{canManageLeaves ? "Review Leaves" : "Apply Leave"}</span>
                <ArrowUpRight size={16} />
              </NavLink>
            )}
            {canViewSalarySection && (
              <NavLink to={canManagePayroll ? "/salary-slips/payroll" : "/salary-slips"} className="quick-action">
                <ReceiptText size={18} />
                <span>{canManagePayroll ? "Payroll & reports" : "Salary slips"}</span>
                <ArrowUpRight size={16} />
              </NavLink>
            )}
            {canManagePayroll && (
              <NavLink to="/salary-slips" className="quick-action">
                <FileDown size={18} />
                <span>All slips</span>
                <ArrowUpRight size={16} />
              </NavLink>
            )}
            {canSubmitExpenses && (
              <NavLink to="/expenses/add" className="quick-action">
                <Wallet size={18} />
                <span>Add expense</span>
                <ArrowUpRight size={16} />
              </NavLink>
            )}
            {canViewExpensesSection && (
              <NavLink to="/expenses/list" className="quick-action">
                <Wallet size={18} />
                <span>{canViewAllExpenses ? "All expenses" : "My expenses"}</span>
                <ArrowUpRight size={16} />
              </NavLink>
            )}
          </div>
        </article>

        <article className="panel glass">
          <h3>Activity Snapshot</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span>Pending Leaves</span>
              <strong>{pendingLeavesCount}</strong>
            </div>
            <div className="activity-item">
              <span>Approved Leaves</span>
              <strong>{approvedLeavesCount}</strong>
            </div>
            <div className="activity-item">
              <span>Uploaded Slips</span>
              <strong>{slips.length}</strong>
            </div>
            {canManageEmployees && (
              <div className="activity-item">
                <span>Registered Users</span>
                <strong>{employees.length}</strong>
              </div>
            )}
            {canViewExpensesSection && (
              <div className="activity-item">
                <span>{canViewAllExpenses ? "Pending Expenses" : "My Expenses"}</span>
                <strong>{canViewAllExpenses ? pendingExpensesCount : expenses.length}</strong>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
