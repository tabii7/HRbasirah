import { FileText, IdCard, Pencil, Trash2 } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { API_BASE } from "../api/client";

export function EmployeesListPage({ app }) {
  const {
    canManageEmployees,
    employees,
    startEditEmployee,
    openDeleteEmployeeModal,
    openFilePreview,
  } = app;
  const navigate = useNavigate();
  if (!canManageEmployees) return <Navigate to="/dashboard" replace />;

  return (
    <section className="panel glass">
      <div className="page-head">
        <h3>Users Directory</h3>
        <p>View all users, documents, and quick actions.</p>
      </div>
      <div className="table-wrap">
        <table className="data-table users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Designation</th>
              <th>ID Docs</th>
              <th>Employment Letter</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="cell-id">{emp.employeeId}</td>
                <td>{emp.fullName}</td>
                <td className="cell-email">{emp.email}</td>
                <td>{(emp.role || "employee").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                <td>{emp.designation || "-"}</td>
                <td>
                  <div className="icon-pills">
                    {emp.idFrontPath && (
                      <button
                        type="button"
                        className="icon-pill"
                        title="View ID front"
                        aria-label="View ID front"
                        onClick={() =>
                          openFilePreview({
                            url: `${API_BASE}${emp.idFrontPath}`,
                            title: `${emp.fullName} — ID Card (Front)`,
                            subtitle: emp.employeeId,
                          })
                        }
                      >
                        <IdCard size={16} />
                        <span className="icon-pill-label">F</span>
                      </button>
                    )}
                    {emp.idBackPath && (
                      <button
                        type="button"
                        className="icon-pill"
                        title="View ID back"
                        aria-label="View ID back"
                        onClick={() =>
                          openFilePreview({
                            url: `${API_BASE}${emp.idBackPath}`,
                            title: `${emp.fullName} — ID Card (Back)`,
                            subtitle: emp.employeeId,
                          })
                        }
                      >
                        <IdCard size={16} />
                        <span className="icon-pill-label">B</span>
                      </button>
                    )}
                    {!emp.idFrontPath && !emp.idBackPath && <span className="cell-empty">-</span>}
                  </div>
                </td>
                <td>
                  {emp.employmentLetterPath ? (
                    <button
                      type="button"
                      className="icon-pill"
                      title="View employment letter"
                      aria-label="View employment letter"
                      onClick={() =>
                        openFilePreview({
                          url: `${API_BASE}${emp.employmentLetterPath}`,
                          title: `${emp.fullName} — Employment Letter`,
                          subtitle: emp.employeeId,
                        })
                      }
                    >
                      <FileText size={16} />
                    </button>
                  ) : (
                    <span className="cell-empty">-</span>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="icon-btn-action edit"
                      title="Edit user"
                      aria-label="Edit user"
                      onClick={() => {
                        startEditEmployee(emp);
                        navigate("/employees/add");
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn-action delete"
                      title="Delete user"
                      aria-label="Delete user"
                      onClick={() => openDeleteEmployeeModal(emp)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
