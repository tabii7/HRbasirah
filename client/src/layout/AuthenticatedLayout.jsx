import { useEffect, useState } from "react";
import {
  Calculator,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { DeleteEmployeeModal, FilePreviewModal, LeaveDecisionModal } from "../components/PortalModals";
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
    messageVariant,
    canManageEmployees,
    canManageLeaves,
    canViewLettersSection,
    canViewSalarySection,
    canManagePayroll,
  } = app;

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  return (
    <div className={`layout-shell ${mobileNavOpen ? "nav-open" : ""}`}>
      {mobileNavOpen && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <header className="mobile-topbar glass">
        <button
          type="button"
          className="mobile-menu-btn"
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="mobile-topbar-brand">
          <img src="/logo.png" alt="" className="mobile-topbar-logo" aria-hidden="true" />
          <span className="mobile-topbar-title">Basirah HR</span>
        </div>
      </header>

      <main className="app-shell">
        {message && (
          <p className={`app-toast message message--${messageVariant}`} role="status" aria-live="polite">
            {message}
          </p>
        )}
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

      <aside className={`sidebar glass ${mobileNavOpen ? "is-open" : ""}`}>
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

      <LeaveDecisionModal app={app} />
      <FilePreviewModal app={app} />
      <DeleteEmployeeModal app={app} />
    </div>
  );
}
