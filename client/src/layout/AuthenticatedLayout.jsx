import {
  Calculator,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileDown,
  FileText,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  UserPlus,
  Users,
} from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { FilePreviewModal, LeaveDecisionModal } from "../components/PortalModals";
import { DashboardPage } from "../pages/DashboardPage";
import { EmployeeFormPage } from "../pages/EmployeeFormPage";
import { EmployeesListPage } from "../pages/EmployeesListPage";
import { LeavesPage } from "../pages/LeavesPage";
import { ReferenceLettersPage } from "../pages/ReferenceLettersPage";
import { SalaryPayrollPage } from "../pages/SalaryPayrollPage";
import { SalarySlipsListPage } from "../pages/SalarySlipsListPage";

export function AuthenticatedLayout({ app }) {
  const {
    user,
    logout,
    location,
    navOpen,
    toggleNavGroup,
    message,
    canManageEmployees,
    canManageLeaves,
    canViewLettersSection,
    canViewSalarySection,
    canManagePayroll,
  } = app;

  return (
    <div className="layout-shell">
      <aside className="sidebar glass">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Basirah Logo" className="brand-logo sidebar-logo" />
          <span className="sidebar-role-badge">{(user.designation || user.role).toUpperCase()}</span>
        </div>
        <nav className="nav-menu">
          <NavLink to="/dashboard" end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          {canManageEmployees && (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-group-toggle ${location.pathname.startsWith("/employees") ? "nav-group-toggle--current" : ""}`}
                onClick={() => toggleNavGroup("employees")}
                aria-expanded={navOpen.employees}
              >
                <Users size={18} />
                <span className="nav-group-label">Employees</span>
                {navOpen.employees ? <ChevronDown size={16} className="nav-chevron" /> : <ChevronRight size={16} className="nav-chevron" />}
              </button>
              {navOpen.employees && (
                <div className="nav-submenu">
                  <NavLink to="/employees/add" className={({ isActive }) => `nav-item nav-subitem ${isActive ? "active" : ""}`}>
                    <UserPlus size={16} />
                    <span>Add user</span>
                  </NavLink>
                  <NavLink to="/employees/list" className={({ isActive }) => `nav-item nav-subitem ${isActive ? "active" : ""}`}>
                    <Users size={16} />
                    <span>Users list</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          <div className="nav-group">
            <button
              type="button"
              className={`nav-group-toggle ${location.pathname.startsWith("/leaves") ? "nav-group-toggle--current" : ""}`}
              onClick={() => toggleNavGroup("leaves")}
              aria-expanded={navOpen.leaves}
            >
              <CalendarDays size={18} />
              <span className="nav-group-label">Leaves</span>
              {navOpen.leaves ? <ChevronDown size={16} className="nav-chevron" /> : <ChevronRight size={16} className="nav-chevron" />}
            </button>
            {navOpen.leaves && (
              <div className="nav-submenu">
                <NavLink to="/leaves" end className={({ isActive }) => `nav-item nav-subitem ${isActive ? "active" : ""}`}>
                  <CalendarDays size={16} />
                  <span>{canManageLeaves ? "All requests" : "My leaves"}</span>
                </NavLink>
              </div>
            )}
          </div>

          {canViewLettersSection && (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-group-toggle ${location.pathname.startsWith("/reference-letters") ? "nav-group-toggle--current" : ""}`}
                onClick={() => toggleNavGroup("letters")}
                aria-expanded={navOpen.letters}
              >
                <FileText size={18} />
                <span className="nav-group-label">Letters</span>
                {navOpen.letters ? <ChevronDown size={16} className="nav-chevron" /> : <ChevronRight size={16} className="nav-chevron" />}
              </button>
              {navOpen.letters && (
                <div className="nav-submenu">
                  <NavLink to="/reference-letters" className={({ isActive }) => `nav-item nav-subitem ${isActive ? "active" : ""}`}>
                    <FileText size={16} />
                    <span>Reference letters</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {canViewSalarySection && (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-group-toggle ${location.pathname.startsWith("/salary-slips") ? "nav-group-toggle--current" : ""}`}
                onClick={() => toggleNavGroup("salary")}
                aria-expanded={navOpen.salary}
              >
                <ReceiptText size={18} />
                <span className="nav-group-label">Salary</span>
                {navOpen.salary ? <ChevronDown size={16} className="nav-chevron" /> : <ChevronRight size={16} className="nav-chevron" />}
              </button>
              {navOpen.salary && (
                <div className="nav-submenu">
                  <NavLink to="/salary-slips" end className={({ isActive }) => `nav-item nav-subitem ${isActive ? "active" : ""}`}>
                    <FileDown size={16} />
                    <span>All slips</span>
                  </NavLink>
                  {canManagePayroll && (
                    <NavLink to="/salary-slips/payroll" className={({ isActive }) => `nav-item nav-subitem ${isActive ? "active" : ""}`}>
                      <Calculator size={16} />
                      <span>Payroll &amp; reports</span>
                    </NavLink>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>
        <button type="button" onClick={logout} className="logout-btn">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="app-shell">
        {message && <p className="message">{message}</p>}
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage app={app} />} />
          <Route path="/employees" element={<Navigate to="/employees/list" replace />} />
          <Route path="/employees/add" element={<EmployeeFormPage app={app} />} />
          <Route path="/employees/list" element={<EmployeesListPage app={app} />} />
          <Route path="/leaves" element={<LeavesPage app={app} />} />
          <Route path="/reference-letters" element={<ReferenceLettersPage app={app} />} />
          <Route path="/salary-slips" element={<SalarySlipsListPage app={app} />} />
          <Route path="/salary-slips/payroll" element={<SalaryPayrollPage app={app} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <LeaveDecisionModal app={app} />
      <FilePreviewModal app={app} />
    </div>
  );
}
