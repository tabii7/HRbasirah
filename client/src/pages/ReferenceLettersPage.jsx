import { Navigate } from "react-router-dom";
import { FieldError } from "../components/FieldError";
import { API_BASE } from "../api/client";
import { sanitizeGeneralText } from "../utils/formValidation";

export function ReferenceLettersPage({ app }) {
  const {
    canViewLettersSection,
    canManageLetters,
    isEmployee,
    referenceForm,
    setReferenceForm,
    referenceFormErrors,
    setReferenceFormErrors,
    applyReferenceLetter,
    referenceLetters,
    referenceNotes,
    setReferenceNotes,
    updateReferenceStatus,
    generateReferenceLetter,
  } = app;

  if (!canViewLettersSection) return <Navigate to="/dashboard" replace />;

  function updateReference(patch) {
    setReferenceForm({ ...referenceForm, ...patch });
    const keys = Object.keys(patch);
    if (keys.length && Object.keys(referenceFormErrors).length) {
      setReferenceFormErrors((prev) => {
        const next = { ...prev };
        keys.forEach((k) => delete next[k]);
        return next;
      });
    }
  }

  return (
    <section className="panel glass">
      <h3>{canManageLetters ? "Reference Letter Requests" : "Apply for Reference Letter"}</h3>
      {isEmployee && (
        <>
          <form className="grid two" onSubmit={applyReferenceLetter} noValidate>
            <div className={referenceFormErrors.purpose ? "field--invalid" : ""}>
              <label>Purpose *</label>
              <input
                placeholder="Purpose (e.g. visa, bank, embassy)"
                value={referenceForm.purpose}
                onChange={(e) => updateReference({ purpose: sanitizeGeneralText(e.target.value) })}
              />
              <FieldError message={referenceFormErrors.purpose} />
            </div>
            <div>
              <label>Addressed To (optional)</label>
              <input
                placeholder="Addressed To (optional)"
                value={referenceForm.addressedTo}
                onChange={(e) => updateReference({ addressedTo: sanitizeGeneralText(e.target.value) })}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Details (optional)</label>
              <textarea
                placeholder="Details to mention (optional)"
                value={referenceForm.details}
                onChange={(e) => updateReference({ details: sanitizeGeneralText(e.target.value) })}
                rows={3}
              />
            </div>
            <button type="submit">Submit Request</button>
          </form>
        </>
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
                    {item.status === "Pending" && (
                      <>
                        <textarea
                          placeholder="Admin note"
                          value={referenceNotes[item.id] || ""}
                          onChange={(e) => setReferenceNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          rows={2}
                        />
                        <div className="action-buttons">
                          <button type="button" onClick={() => updateReferenceStatus(item.id, "Approved")}>
                            Approve
                          </button>
                          <button type="button" onClick={() => updateReferenceStatus(item.id, "Rejected")}>
                            Reject
                          </button>
                        </div>
                      </>
                    )}
                    {item.status === "Approved" && !item.filePath && (
                      <button type="button" onClick={() => generateReferenceLetter(item.id)}>
                        Generate PDF
                      </button>
                    )}
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
