import { Navigate } from "react-router-dom";
import { HR_MAX_APPROVAL_DAYS } from "../constants/roles";
import { API_BASE } from "../api/client";

export function LeavesPage({ app }) {
  const {
    canManageLeaves,
    canApplyLeave,
    leaveForm,
    setLeaveForm,
    applyLeave,
    leaves,
    user,
    leaveDocFiles,
    setLeaveDocFiles,
    uploadLeaveSupportingDoc,
    openLeaveDecisionModal,
    canApproveLeaves,
    setMessage,
  } = app;

  if (!canManageLeaves && !canApplyLeave) return <Navigate to="/dashboard" replace />;

  const leaveDays = (() => {
    if (!leaveForm.startDate || !leaveForm.endDate) return 0;
    const start = new Date(`${leaveForm.startDate}T00:00:00`);
    const end = new Date(`${leaveForm.endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
    return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  })();

  const requiresDoc = leaveForm.leaveType === "sick" && leaveDays > 2;
  const isDocFile = (name = "") => /\.(pdf|png|jpe?g)$/i.test(name);

  return (
    <section className="panel glass">
      <h3>{canManageLeaves ? "Leave Requests" : "Apply for Leave"}</h3>
      {canApplyLeave && (
        <form className="grid two" onSubmit={applyLeave}>
          <input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required />
          <input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required />
          <select value={leaveForm.leaveType} onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })} required>
            <option value="casual">Casual Leave</option>
            <option value="sick">Sick Leave</option>
          </select>
          <input
            placeholder="Details (optional)"
            value={leaveForm.leaveDetails}
            onChange={(e) => setLeaveForm({ ...leaveForm, leaveDetails: e.target.value })}
          />
          {requiresDoc && (
            <>
              <label className="doc-upload-control">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setLeaveForm({ ...leaveForm, supportingDoc: e.target.files?.[0] || null })}
                />
                <span className="doc-upload-btn">Choose report/slip</span>
                <span className="doc-upload-name">{leaveForm.supportingDoc?.name || "No file chosen"}</span>
              </label>
              <small style={{ opacity: 0.85 }}>
                Doctor slip/report is needed for sick leave above 2 days. You can submit now and upload this later too.
              </small>
            </>
          )}
          <button type="submit">Submit Leave</button>
        </form>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {canManageLeaves && <th>User</th>}
              <th>Dates</th>
              <th>Reason</th>
              <th>Supporting Doc</th>
              <th>Admin Note</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => {
              const normalizedType = String(leave.leaveType || "").toLowerCase();
              const isSickLeave = normalizedType === "sick" || /sick/i.test(String(leave.reason || ""));
              const needsDoc = isSickLeave && !leave.supportingDocPath;
              const isOwnLeave = Number(leave.employeeUserId) === Number(user?.id);
              const showUploadAction = needsDoc && isOwnLeave;

              const startMs = new Date(`${leave.startDate}T00:00:00`).getTime();
              const endMs = new Date(`${leave.endDate}T00:00:00`).getTime();
              const totalLeaveDays =
                Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs
                  ? Math.floor((endMs - startMs) / 86400000) + 1
                  : 0;
              const isHrUser = user?.role === "hr";
              const exceedsHrLimit = isHrUser && totalLeaveDays > HR_MAX_APPROVAL_DAYS;
              const canDecideThisLeave = canApproveLeaves && !exceedsHrLimit;

              return (
                <tr key={leave.id}>
                  {canManageLeaves && <td>{leave.fullName}</td>}
                  <td>
                    {leave.startDate} to {leave.endDate}
                  </td>
                  <td>
                    {leave.leaveType ? `${String(leave.leaveType).replace(/\b\w/g, (c) => c.toUpperCase())} Leave` : leave.reason}
                    {leave.leaveDetails ? ` - ${leave.leaveDetails}` : ""}
                  </td>
                  <td>
                    {leave.supportingDocPath ? (
                      <a href={`${API_BASE}${leave.supportingDocPath}`} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      "Not uploaded"
                    )}
                  </td>
                  <td>{leave.adminNote || "-"}</td>
                  <td>
                    <span className={`status-badge status-${String(leave.status || "pending").toLowerCase()}`}>
                      {leave.status || "Pending"}
                    </span>
                  </td>
                  <td className="action-cell">
                    {showUploadAction && (
                      <div className="action-buttons">
                        <label className="doc-upload-control doc-upload-control--compact">
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (file && !isDocFile(file.name)) {
                                setMessage("Only PDF/JPG/PNG files are allowed");
                                return;
                              }
                              setLeaveDocFiles((prev) => ({ ...prev, [leave.id]: file }));
                            }}
                          />
                          <span className="doc-upload-btn">Choose file</span>
                          <span className="doc-upload-name">{leaveDocFiles[leave.id]?.name || "No file chosen"}</span>
                        </label>
                        <button type="button" onClick={() => uploadLeaveSupportingDoc(leave.id)}>
                          Upload Doc
                        </button>
                      </div>
                    )}
                    {canDecideThisLeave && leave.status === "Pending" ? (
                      <div className="action-buttons">
                        <button type="button" className="table-action-btn approve" onClick={() => openLeaveDecisionModal(leave.id, "Approved")}>
                          Approve
                        </button>
                        <button type="button" className="table-action-btn reject" onClick={() => openLeaveDecisionModal(leave.id, "Rejected")}>
                          Not Approve
                        </button>
                      </div>
                    ) : exceedsHrLimit && leave.status === "Pending" ? (
                      <span className="cell-note">Needs manager / admin</span>
                    ) : (
                      !showUploadAction && <span className="cell-empty">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
