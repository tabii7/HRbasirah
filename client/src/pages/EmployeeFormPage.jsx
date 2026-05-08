import { Navigate } from "react-router-dom";
import { UploadCard } from "../components/UploadCard";

export function EmployeeFormPage({ app }) {
  const { canManageEmployees, editingEmployeeId, employeeForm, setEmployeeForm, saveEmployee } = app;
  if (!canManageEmployees) return <Navigate to="/dashboard" replace />;

  return (
    <section className="panel glass">
      <div className="page-head">
        <h3>{editingEmployeeId ? "Edit User Profile" : "Create New User"}</h3>
        <p>Complete profile details and attach required documents.</p>
      </div>
      <form className="grid" onSubmit={saveEmployee}>
        <div className="form-section">
          <h4>Personal Details</h4>
          <div className="two">
            <div className="field">
              <label>Full Name *</label>
              <input value={employeeForm.fullName} onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })} required />
            </div>
            <div className="field">
              <label>Email Address *</label>
              <input type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} required />
            </div>
            <div className="field">
              <label>Password {!editingEmployeeId ? "*" : ""}</label>
              <input
                type="password"
                value={employeeForm.password}
                onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                required={!editingEmployeeId}
              />
            </div>
            <div className="field">
              <label>Birth Date</label>
              <input type="date" value={employeeForm.birthdate} onChange={(e) => setEmployeeForm({ ...employeeForm, birthdate: e.target.value })} />
            </div>
            <div className="field">
              <label>Designation</label>
              <input value={employeeForm.designation} onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })} />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={employeeForm.role} onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}>
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
                <option value="general_manager">General Manager</option>
              </select>
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input value={employeeForm.phone} onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Joined Date</label>
              <input type="date" value={employeeForm.joinedDate} onChange={(e) => setEmployeeForm({ ...employeeForm, joinedDate: e.target.value })} />
            </div>
            <div className="field">
              <label>Monthly Salary</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={employeeForm.monthlySalary}
                onChange={(e) => setEmployeeForm({ ...employeeForm, monthlySalary: e.target.value })}
              />
            </div>
            <div className="field address-field">
              <label>Address</label>
              <textarea value={employeeForm.address} onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })} rows={3} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Documents</h4>
          <div className="three">
            <UploadCard
              label="ID Front"
              accept="image/*,.pdf"
              fileValue={employeeForm.idFront}
              onFileChange={(file) => setEmployeeForm({ ...employeeForm, idFront: file })}
              isImage
            />
            <UploadCard
              label="ID Back"
              accept="image/*,.pdf"
              fileValue={employeeForm.idBack}
              onFileChange={(file) => setEmployeeForm({ ...employeeForm, idBack: file })}
              isImage
            />
            <UploadCard
              label="Employment Letter (PDF)"
              accept="application/pdf"
              fileValue={employeeForm.employmentLetter}
              onFileChange={(file) => setEmployeeForm({ ...employeeForm, employmentLetter: file })}
            />
          </div>
        </div>

        <button type="submit">{editingEmployeeId ? "Update User" : "Create User"}</button>
      </form>
    </section>
  );
}
