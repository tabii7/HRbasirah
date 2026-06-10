import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { validateEmployeeForm } from "../utils/employeeValidation";
import {
  validateLeaveForm,
  validateLoginForm,
  validatePayrollSelection,
  validateReferenceForm,
  validateExpenseForm,
} from "../utils/formValidation";
import {
  MANAGEMENT_ROLES,
  EMPLOYEE_MANAGEMENT_ROLES,
  LEAVE_MANAGEMENT_ROLES,
  LEAVE_APPROVER_ROLES,
  PAYROLL_MANAGEMENT_ROLES,
  LETTER_MANAGEMENT_ROLES,
  EXPENSE_SUBMIT_ROLES,
  EXPENSE_VIEW_ROLES,
  EXPENSE_APPROVE_ROLES,
} from "../constants/roles";

export function useHrPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [slips, setSlips] = useState([]);
  const [referenceLetters, setReferenceLetters] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState("");
  const [messageVariant, setMessageVariant] = useState("info");
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [employeeFormErrors, setEmployeeFormErrors] = useState({});
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  function showMessage(text, variant = "info") {
    setMessage(text);
    setMessageVariant(variant);
  }

  const [loginForm, setLoginForm] = useState({ email: "admin@basirah.local", password: "admin123" });
  const [loginFormErrors, setLoginFormErrors] = useState({});
  const [leaveFormErrors, setLeaveFormErrors] = useState({});
  const [referenceFormErrors, setReferenceFormErrors] = useState({});
  const [expenseFormErrors, setExpenseFormErrors] = useState({});
  const [payrollFormErrors, setPayrollFormErrors] = useState({});
  const [employeeForm, setEmployeeForm] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    password: "",
    birthdate: "",
    designation: "",
    role: "employee",
    phone: "",
    address: "",
    joinedDate: "",
    monthlySalary: "",
    idFront: null,
    idBack: null,
    employmentLetter: null,
  });
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    leaveType: "casual",
    leaveDetails: "",
    supportingDoc: null,
  });
  const [leaveNotes, setLeaveNotes] = useState({});
  const [leaveDocFiles, setLeaveDocFiles] = useState({});
  const [leaveDecisionModal, setLeaveDecisionModal] = useState({
    open: false,
    leaveId: null,
    status: "Approved",
    note: "",
  });
  const [filePreview, setFilePreview] = useState({
    open: false,
    url: "",
    type: "image",
    title: "",
    subtitle: "",
  });
  const [deleteEmployeeModal, setDeleteEmployeeModal] = useState({
    open: false,
    employeeId: null,
    fullName: "",
    employeeCode: "",
  });
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  const [referenceForm, setReferenceForm] = useState({ purpose: "", details: "", addressedTo: "" });
  const [expenseNotes, setExpenseNotes] = useState({});
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    expenseDate: "",
    description: "",
    receipt: null,
  });
  const [referenceNotes, setReferenceNotes] = useState({});
  const [salaryCalcForm, setSalaryCalcForm] = useState({
    employeeUserId: "",
    month: "",
    totalSalary: "",
  });
  const [payrollPreview, setPayrollPreview] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [payrollLoading, setPayrollLoading] = useState(false);

  const currentMonthValue = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const isManagement = MANAGEMENT_ROLES.includes(user?.role);
  const isEmployee = user?.role === "employee";
  const canManageEmployees = EMPLOYEE_MANAGEMENT_ROLES.includes(user?.role);
  const canManageLeaves = LEAVE_MANAGEMENT_ROLES.includes(user?.role);
  const canApproveLeaves = LEAVE_APPROVER_ROLES.includes(user?.role);
  const canManagePayroll = PAYROLL_MANAGEMENT_ROLES.includes(user?.role);
  const canManageLetters = LETTER_MANAGEMENT_ROLES.includes(user?.role);
  const canViewSalarySection = Boolean(user);
  const canViewLettersSection = isEmployee || canManageLetters;
  const canApplyLeave = ["employee", "hr"].includes(user?.role);
  const canSubmitExpenses = EXPENSE_SUBMIT_ROLES.includes(user?.role);
  const canViewAllExpenses = EXPENSE_VIEW_ROLES.includes(user?.role);
  const canApproveExpenses = EXPENSE_APPROVE_ROLES.includes(user?.role);
  const canViewExpensesSection = canSubmitExpenses || canViewAllExpenses;

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401) {
          setToken("");
          setUser(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setEmployees([]);
          setLeaves([]);
          setSlips([]);
          setReferenceLetters([]);
          setExpenses([]);
          showMessage("Session expired. Please login again.", "error");
          navigate("/", { replace: true });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [navigate]);

  async function login(e) {
    e.preventDefault();
    const validation = validateLoginForm(loginForm);
    if (!validation.valid) {
      setLoginFormErrors(validation.errors);
      showMessage("Please fix the highlighted errors", "error");
      return;
    }
    setLoginFormErrors({});
    try {
      const { data } = await api.post("/auth/login", loginForm);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage(`Welcome ${data.user.fullName}`);
    } catch (err) {
      showMessage(err.response?.data?.message || "Login failed", "error");
    }
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setEmployees([]);
    setLeaves([]);
    setSlips([]);
    setReferenceLetters([]);
    setExpenses([]);
    setPayrollPreview(null);
    setMonthlyReport(null);
    setMessage("Logged out successfully");
    navigate("/", { replace: true });
  }

  async function refreshEmployees() {
    if (!token || !canManageEmployees) return;
    const { data } = await api.get("/employees", { headers: authHeaders });
    setEmployees(data);
  }

  async function fetchAll({ silent = false } = {}) {
    if (!token) return;
    try {
      const requests = [];
      if (canManageEmployees) {
        requests.push(api.get("/employees", { headers: authHeaders }).then((res) => setEmployees(res.data)));
      } else {
        setEmployees([]);
      }
      if (canManageLeaves || canApplyLeave) {
        requests.push(api.get("/leaves", { headers: authHeaders }).then((res) => setLeaves(res.data)));
      } else {
        setLeaves([]);
      }
      if (canViewSalarySection) {
        requests.push(api.get("/salary-slips", { headers: authHeaders }).then((res) => setSlips(res.data)));
      } else {
        setSlips([]);
      }
      if (canViewLettersSection) {
        requests.push(api.get("/reference-letters", { headers: authHeaders }).then((res) => setReferenceLetters(res.data)));
      } else {
        setReferenceLetters([]);
      }
      if (canViewExpensesSection) {
        requests.push(api.get("/expenses", { headers: authHeaders }).then((res) => setExpenses(res.data)));
      } else {
        setExpenses([]);
      }
      await Promise.all(requests);
    } catch (err) {
      if (err.response?.status === 401) return;
      if (!silent) {
        const isNetwork = !err.response && (err.code === "ERR_NETWORK" || err.message === "Network Error");
        showMessage(
          isNetwork
            ? "Cannot reach the API. Start the backend: cd server && npm run dev (port 5001)"
            : err.response?.data?.message || "Failed loading data",
          "error"
        );
      }
    }
  }

  useEffect(() => {
    fetchAll();
  }, [token, user?.role, canManageEmployees, canManageLeaves, canApplyLeave, canViewSalarySection, canViewLettersSection, canViewExpensesSection]);

  useEffect(() => {
    if (!filePreview.open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") closeFilePreview();
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [filePreview.open]);

  useEffect(() => {
    if (!leaveDecisionModal.open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") closeLeaveDecisionModal();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [leaveDecisionModal.open]);

  useEffect(() => {
    if (!deleteEmployeeModal.open) return undefined;
    function onKey(e) {
      if (e.key === "Escape" && !deletingEmployee) closeDeleteEmployeeModal();
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [deleteEmployeeModal.open, deletingEmployee]);

  useEffect(() => {
    if (!message) return undefined;
    const timeoutId = setTimeout(() => setMessage(""), 3500);
    return () => clearTimeout(timeoutId);
  }, [message]);

  async function saveEmployee(e) {
    e.preventDefault();
    if (savingEmployee) return;

    const wasEditing = Boolean(editingEmployeeId);
    const editingEmployee = wasEditing ? employees.find((emp) => emp.id === editingEmployeeId) : null;
    const validation = validateEmployeeForm(employeeForm, {
      isEdit: wasEditing,
      hasIdFront: Boolean(employeeForm.idFront || editingEmployee?.idFrontPath),
      hasIdBack: Boolean(employeeForm.idBack || editingEmployee?.idBackPath),
      hasEmploymentLetter: Boolean(employeeForm.employmentLetter || editingEmployee?.employmentLetterPath),
    });

    if (!validation.valid) {
      setEmployeeFormErrors(validation.errors);
      showMessage("Please fix the highlighted errors before saving", "error");
      return;
    }

    setEmployeeFormErrors({});
    setSavingEmployee(true);
    try {
      const body = new FormData();
      if (wasEditing) {
        body.append("employeeId", employeeForm.employeeId);
      }
      body.append("fullName", employeeForm.fullName.trim());
      body.append("email", employeeForm.email.trim());
      if (!wasEditing || employeeForm.password) {
        body.append("password", employeeForm.password);
      }
      body.append("birthdate", employeeForm.birthdate);
      body.append("designation", employeeForm.designation);
      body.append("role", employeeForm.role);
      body.append("phone", employeeForm.phone);
      body.append("address", employeeForm.address);
      body.append("joinedDate", employeeForm.joinedDate);
      body.append("monthlySalary", employeeForm.monthlySalary);
      if (employeeForm.idFront) body.append("idFront", employeeForm.idFront);
      if (employeeForm.idBack) body.append("idBack", employeeForm.idBack);
      if (employeeForm.employmentLetter) body.append("employmentLetter", employeeForm.employmentLetter);

      if (wasEditing) {
        await api.put(`/employees/${editingEmployeeId}`, body, { headers: authHeaders });
      } else {
        await api.post("/employees", body, { headers: authHeaders });
      }

      setEditingEmployeeId(null);
      setEmployeeForm({
        employeeId: "",
        fullName: "",
        email: "",
        password: "",
        birthdate: "",
        designation: "",
        role: "employee",
        phone: "",
        address: "",
        joinedDate: "",
        monthlySalary: "",
        idFront: null,
        idBack: null,
        employmentLetter: null,
      });

      await refreshEmployees();
      showMessage(wasEditing ? "User updated successfully" : "User added successfully", "success");
      navigate("/employees/list");
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        setEmployeeFormErrors(apiErrors);
      }
      const apiMessage = err.response?.data?.message;
      showMessage(apiMessage || err.message || "Could not save user", "error");
    } finally {
      setSavingEmployee(false);
    }
  }

  function startEditEmployee(emp) {
    setEditingEmployeeId(emp.id);
    setEmployeeFormErrors({});
    setEmployeeForm({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      email: emp.email,
      password: "",
      birthdate: emp.birthdate || "",
      designation: emp.designation || "",
      role: emp.role || "employee",
      phone: emp.phone || "",
      address: emp.address || "",
      joinedDate: emp.joinedDate || "",
      monthlySalary: emp.monthlySalary || "",
      idFront: null,
      idBack: null,
      employmentLetter: null,
    });
  }

  function openDeleteEmployeeModal(emp) {
    setDeleteEmployeeModal({
      open: true,
      employeeId: emp.id,
      fullName: emp.fullName || "",
      employeeCode: emp.employeeId || "",
    });
  }

  function closeDeleteEmployeeModal() {
    if (deletingEmployee) return;
    setDeleteEmployeeModal({ open: false, employeeId: null, fullName: "", employeeCode: "" });
  }

  async function confirmDeleteEmployee() {
    const id = deleteEmployeeModal.employeeId;
    if (!id || deletingEmployee) return;

    setDeletingEmployee(true);
    try {
      await api.delete(`/employees/${id}`, { headers: authHeaders });
      if (Number(editingEmployeeId) === Number(id)) {
        setEditingEmployeeId(null);
        setEmployeeForm({
          employeeId: "",
          fullName: "",
          email: "",
          password: "",
          birthdate: "",
          designation: "",
          role: "employee",
          phone: "",
          address: "",
          joinedDate: "",
          monthlySalary: "",
          idFront: null,
          idBack: null,
          employmentLetter: null,
        });
        setEmployeeFormErrors({});
      }
      setDeleteEmployeeModal({ open: false, employeeId: null, fullName: "", employeeCode: "" });
      await refreshEmployees();
      fetchAll({ silent: true });
      showMessage("User deleted successfully", "success");
    } catch (err) {
      showMessage(err.response?.data?.message || "Could not delete user", "error");
    } finally {
      setDeletingEmployee(false);
    }
  }

  async function applyLeave(e) {
    e.preventDefault();
    const validation = validateLeaveForm(leaveForm);
    if (!validation.valid) {
      setLeaveFormErrors(validation.errors);
      showMessage("Please fix the highlighted errors before submitting", "error");
      return;
    }
    setLeaveFormErrors({});
    try {
      const body = new FormData();
      body.append("startDate", leaveForm.startDate);
      body.append("endDate", leaveForm.endDate);
      body.append("leaveType", leaveForm.leaveType);
      if (leaveForm.leaveDetails?.trim()) body.append("leaveDetails", leaveForm.leaveDetails.trim());
      if (leaveForm.supportingDoc) body.append("supportingDoc", leaveForm.supportingDoc);
      await api.post("/leaves", body, { headers: authHeaders });
      setLeaveForm({
        startDate: "",
        endDate: "",
        leaveType: "casual",
        leaveDetails: "",
        supportingDoc: null,
      });
      setMessage("Leave request submitted");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not apply leave");
    }
  }

  async function uploadLeaveSupportingDoc(leaveId) {
    const file = leaveDocFiles[leaveId];
    if (!file) {
      setMessage("Please choose a report/slip file first");
      return;
    }
    try {
      const body = new FormData();
      body.append("supportingDoc", file);
      await api.patch(`/leaves/${leaveId}/supporting-doc`, body, { headers: authHeaders });
      setLeaveDocFiles((prev) => ({ ...prev, [leaveId]: null }));
      setMessage("Supporting document uploaded");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not upload supporting document");
    }
  }

  async function updateLeaveStatus(id, status, noteOverride) {
    const note = String(noteOverride ?? leaveNotes[id] ?? "").trim();
    if (!note) {
      setMessage("Please add a note before approving or rejecting leave");
      return;
    }
    await api.patch(`/leaves/${id}/status`, { status, note }, { headers: authHeaders });
    setLeaveNotes((prev) => ({ ...prev, [id]: "" }));
    setMessage(`Leave ${status.toLowerCase()}`);
    fetchAll();
  }

  function openLeaveDecisionModal(leaveId, status) {
    setLeaveDecisionModal({ open: true, leaveId, status, note: "" });
  }

  function closeLeaveDecisionModal() {
    setLeaveDecisionModal({ open: false, leaveId: null, status: "Approved", note: "" });
  }

  async function submitLeaveDecisionFromModal() {
    if (!leaveDecisionModal.leaveId) return;
    await updateLeaveStatus(leaveDecisionModal.leaveId, leaveDecisionModal.status, leaveDecisionModal.note);
    closeLeaveDecisionModal();
  }

  function openFilePreview({ url, title = "", subtitle = "" }) {
    if (!url) return;
    const lower = url.toLowerCase().split("?")[0];
    const isPdf = lower.endsWith(".pdf");
    setFilePreview({
      open: true,
      url,
      type: isPdf ? "pdf" : "image",
      title,
      subtitle,
    });
  }

  function closeFilePreview() {
    setFilePreview({ open: false, url: "", type: "image", title: "", subtitle: "" });
  }

  async function submitExpense(e) {
    e.preventDefault();
    const validation = validateExpenseForm(expenseForm);
    if (!validation.valid) {
      setExpenseFormErrors(validation.errors);
      showMessage("Please fix the highlighted errors before submitting", "error");
      return;
    }
    setExpenseFormErrors({});
    try {
      const body = new FormData();
      body.append("title", expenseForm.title.trim());
      body.append("amount", expenseForm.amount.trim());
      body.append("expenseDate", expenseForm.expenseDate);
      if (expenseForm.description?.trim()) body.append("description", expenseForm.description.trim());
      if (expenseForm.receipt) body.append("receipt", expenseForm.receipt);
      await api.post("/expenses", body, { headers: authHeaders });
      setExpenseForm({ title: "", amount: "", expenseDate: "", description: "", receipt: null });
      showMessage("Expense submitted for approval");
      await fetchAll();
      navigate("/expenses/list");
    } catch (err) {
      showMessage(err.response?.data?.message || "Could not submit expense", "error");
    }
  }

  async function updateExpenseStatus(id, status) {
    const note = (expenseNotes[id] || "").trim();
    if (!note) {
      showMessage("Please add a note before approving or rejecting the expense", "error");
      return;
    }
    try {
      await api.patch(`/expenses/${id}/status`, { status, note }, { headers: authHeaders });
      setExpenseNotes((prev) => ({ ...prev, [id]: "" }));
      showMessage(`Expense ${status.toLowerCase()}`);
      fetchAll();
    } catch (err) {
      showMessage(err.response?.data?.message || "Could not update expense", "error");
    }
  }

  async function applyReferenceLetter(e) {
    e.preventDefault();
    const validation = validateReferenceForm(referenceForm);
    if (!validation.valid) {
      setReferenceFormErrors(validation.errors);
      showMessage("Please fix the highlighted errors before submitting", "error");
      return;
    }
    setReferenceFormErrors({});
    try {
      await api.post("/reference-letters", referenceForm, { headers: authHeaders });
      setReferenceForm({ purpose: "", details: "", addressedTo: "" });
      setMessage("Reference letter request submitted");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not submit request");
    }
  }

  async function updateReferenceStatus(id, status) {
    const note = (referenceNotes[id] || "").trim();
    if (!note) {
      setMessage("Please add a note before approving/rejecting request");
      return;
    }
    try {
      await api.patch(`/reference-letters/${id}/status`, { status, note }, { headers: authHeaders });
      setReferenceNotes((prev) => ({ ...prev, [id]: "" }));
      setMessage(`Reference letter ${status.toLowerCase()}`);
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not update reference letter request");
    }
  }

  async function generateReferenceLetter(id) {
    try {
      await api.post(`/reference-letters/${id}/generate`, {}, { headers: authHeaders });
      setMessage("Reference letter generated");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not generate reference letter");
    }
  }

  async function loadSalaryReport() {
    if (!canManagePayroll) return;
    const validation = validatePayrollSelection(salaryCalcForm);
    if (!validation.valid) {
      setPayrollFormErrors(validation.errors);
      showMessage("Please select a month", "error");
      return;
    }
    setPayrollFormErrors({});
    setPayrollLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const reportRes = await api.get("/payroll/monthly-report", {
        headers: authHeaders,
        params: { month: salaryCalcForm.month, asOfDate: today },
      });
      setMonthlyReport(reportRes.data);
      if (salaryCalcForm.employeeUserId) {
        const previewRes = await api.get("/payroll/preview", {
          headers: authHeaders,
          params: { employeeUserId: salaryCalcForm.employeeUserId, month: salaryCalcForm.month, asOfDate: today },
        });
        setPayrollPreview(previewRes.data);
      } else {
        setPayrollPreview(null);
      }
    } catch (err) {
      if (err.response?.status === 401) return;
      setMessage(err.response?.data?.message || "Could not load salary report");
    } finally {
      setPayrollLoading(false);
    }
  }

  async function generateSalarySlip() {
    if (!salaryCalcForm.month) {
      setMessage("Select month first");
      return;
    }
    if (canManagePayroll && !salaryCalcForm.employeeUserId) {
      setMessage("Select user and month, then generate slip");
      return;
    }
    try {
      const payload = canManagePayroll
        ? { employeeUserId: salaryCalcForm.employeeUserId, month: salaryCalcForm.month }
        : { month: salaryCalcForm.month };
      await api.post(
        "/salary-slips/generate",
        payload,
        { headers: authHeaders }
      );
      setMessage("Salary slip generated successfully");
      setSalaryCalcForm((prev) => ({
        ...prev,
        employeeUserId: canManagePayroll ? "" : prev.employeeUserId,
        totalSalary: canManagePayroll ? "" : prev.totalSalary,
        month: currentMonthValue,
      }));
      setPayrollPreview(null);
      fetchAll();
    } catch (err) {
      const responseData = err.response?.data;
      if (typeof responseData === "string" && responseData.includes("<!DOCTYPE html>")) {
        setMessage("Backend is not updated. Please restart server and try again.");
        return;
      }
      setMessage(responseData?.message || err.message || "Could not generate salary slip");
    }
  }

  useEffect(() => {
    if (!salaryCalcForm.employeeUserId) return;
    const selected = employees.find((emp) => String(emp.id) === String(salaryCalcForm.employeeUserId));
    if (!selected) return;
    setSalaryCalcForm((prev) => ({
      ...prev,
      month: prev.month || currentMonthValue,
      totalSalary: selected.monthlySalary ? String(selected.monthlySalary) : prev.totalSalary,
    }));
  }, [salaryCalcForm.employeeUserId, employees, currentMonthValue]);

  useEffect(() => {
    if (!canManagePayroll) return;
    if (!salaryCalcForm.month) {
      setSalaryCalcForm((prev) => ({ ...prev, month: currentMonthValue }));
    }
  }, [canManagePayroll, salaryCalcForm.month, currentMonthValue]);

  useEffect(() => {
    if (!canManagePayroll) return;
    setMonthlyReport(null);
    setPayrollPreview(null);
  }, [canManagePayroll, salaryCalcForm.month, salaryCalcForm.employeeUserId]);

  const [navOpen, setNavOpen] = useState({
    employees: true,
    leaves: true,
    salary: true,
    letters: true,
    expenses: true,
  });

  useEffect(() => {
    const p = location.pathname;
    setNavOpen((prev) => ({
      ...prev,
      ...(p.startsWith("/employees") ? { employees: true } : {}),
      ...(p.startsWith("/leaves") ? { leaves: true } : {}),
      ...(p.startsWith("/salary-slips") ? { salary: true } : {}),
      ...(p.startsWith("/reference-letters") ? { letters: true } : {}),
      ...(p.startsWith("/expenses") ? { expenses: true } : {}),
    }));
  }, [location.pathname]);

  function toggleNavGroup(key) {
    setNavOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function deleteSlip(id) {
    await api.delete(`/salary-slips/${id}`, { headers: authHeaders });
    setMessage("Slip removed");
    fetchAll();
  }

  const pendingLeavesCount = leaves.filter((item) => item.status === "Pending").length;
  const approvedLeavesCount = leaves.filter((item) => item.status === "Approved").length;
  const pendingExpensesCount = expenses.filter((item) => item.status === "Pending").length;

  return {
    navigate,
    location,
    api,
    authHeaders,
    token,
    user,
    employees,
    leaves,
    slips,
    referenceLetters,
    expenses,
    message,
    messageVariant,
    setMessage,
    showMessage,
    savingEmployee,
    employeeFormErrors,
    setEmployeeFormErrors,
    editingEmployeeId,
    setEditingEmployeeId,
    loginForm,
    setLoginForm,
    loginFormErrors,
    setLoginFormErrors,
    leaveFormErrors,
    setLeaveFormErrors,
    referenceFormErrors,
    setReferenceFormErrors,
    expenseFormErrors,
    setExpenseFormErrors,
    payrollFormErrors,
    setPayrollFormErrors,
    employeeForm,
    setEmployeeForm,
    leaveForm,
    setLeaveForm,
    leaveNotes,
    setLeaveNotes,
    leaveDocFiles,
    setLeaveDocFiles,
    leaveDecisionModal,
    setLeaveDecisionModal,
    filePreview,
    setFilePreview,
    referenceForm,
    setReferenceForm,
    expenseForm,
    setExpenseForm,
    expenseNotes,
    setExpenseNotes,
    referenceNotes,
    setReferenceNotes,
    salaryCalcForm,
    setSalaryCalcForm,
    payrollPreview,
    setPayrollPreview,
    monthlyReport,
    setMonthlyReport,
    payrollLoading,
    currentMonthValue,
    navOpen,
    setNavOpen,
    isManagement,
    isEmployee,
    canManageEmployees,
    canManageLeaves,
    canApproveLeaves,
    canManagePayroll,
    canManageLetters,
    canViewSalarySection,
    canViewLettersSection,
    canApplyLeave,
    canSubmitExpenses,
    canViewAllExpenses,
    canApproveExpenses,
    canViewExpensesSection,
    pendingLeavesCount,
    pendingExpensesCount,
    approvedLeavesCount,
    login,
    logout,
    fetchAll,
    saveEmployee,
    startEditEmployee,
    openDeleteEmployeeModal,
    closeDeleteEmployeeModal,
    confirmDeleteEmployee,
    deleteEmployeeModal,
    deletingEmployee,
    applyLeave,
    uploadLeaveSupportingDoc,
    updateLeaveStatus,
    openLeaveDecisionModal,
    closeLeaveDecisionModal,
    submitLeaveDecisionFromModal,
    openFilePreview,
    closeFilePreview,
    submitExpense,
    updateExpenseStatus,
    applyReferenceLetter,
    updateReferenceStatus,
    generateReferenceLetter,
    loadSalaryReport,
    generateSalarySlip,
    toggleNavGroup,
    deleteSlip,
  };
}
