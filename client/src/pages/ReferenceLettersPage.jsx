import { Navigate } from "react-router-dom";
import { API_BASE } from "../api/client";

export function ReferenceLettersPage({ app }) {
  const {
    canViewLettersSection,
    canManageLetters,
    isEmployee,
    referenceForm,
    setReferenceForm,
    applyReferenceLetter,
    referenceLetters,
    referenceNotes,
    setReferenceNotes,
    updateReferenceStatus,
    generateReferenceLetter,
  } = app;

  if (!canViewLettersSection) return <Navigate to="/dashboard" replace />;

  return (
    <section className="panel glass">
      <h3>{canManageLetters ? "Reference Letter Requests" : "Apply for Reference Letter"}</h3>
      {isEmployee && (
        <form className="grid two" onSubmit={applyReferenceLetter}>
          <input
            placeholder="Purpose (e.g. visa, bank, embassy)"
            value={referenceForm.purpose}
            onChange={(e) => setReferenceForm({ ...referenceForm, purpose: e.target.value })}
            required
          />
          <input
            placeholder="Addressed To (optional)"
            value={referenceForm.addressedTo}
            onChange={(e) => setReferenceForm({ ...referenceForm, addressedTo: e.target.value })}
          />
          <textarea
            placeholder="Details to mention (optional)"
            value={referenceForm.details}
            onChange={(e) => setReferenceForm({ ...referenceForm, details: e.target.value })}
            rows={3}
          />
          <button type="submit">Submit Request</button>
        </form>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {canManageLetters && <th>User</th>}
              <th>Purpose</th>
              <th>Addressed To</th>
              <th>Status</th>
              <th>Admin Note</th>
              <th>Letter</th>
              {canManageLetters && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {referenceLetters.map((item) => (
              <tr key={item.id}>
                {canManageLetters && <td>{item.fullName}</td>}
                <td>
                  {item.purpose}
                  {item.details ? ` - ${item.details}` : ""}
                </td>
                <td>{item.addressedTo || "-"}</td>
                <td>{item.status}</td>
                <td>{item.adminNote || "-"}</td>
                <td>
                  {item.filePath ? (
                    <a href={`${API_BASE}${item.filePath}?v=${encodeURIComponent(item.generatedAt || "")}`} target="_blank" rel="noreferrer">
                      Download
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                {canManageLetters && (
                  <td className="action-cell">
                    <textarea
                      className="note-input"
                      placeholder="Add note..."
                      value={referenceNotes[item.id] || ""}
                      onChange={(e) => setReferenceNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      rows={2}
                    />
                    <div className="action-buttons">
                      <button type="button" className="table-action-btn approve" onClick={() => updateReferenceStatus(item.id, "Approved")}>
                        Approve
                      </button>
                      <button type="button" className="table-action-btn reject" onClick={() => updateReferenceStatus(item.id, "Rejected")}>
                        Reject
                      </button>
                      <button type="button" onClick={() => generateReferenceLetter(item.id)} disabled={item.status !== "Approved"}>
                        Generate Letter
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
