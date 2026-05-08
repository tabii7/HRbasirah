import { useEffect, useState } from "react";
import { FileText, Image, Trash2, Upload } from "lucide-react";

export function UploadCard({ label, accept, fileValue, onFileChange, isImage }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!fileValue || !isImage || !fileValue.type?.startsWith("image/")) {
      setPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(fileValue);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [fileValue, isImage]);

  return (
    <div className="upload-card">
      <label className={`upload-dropzone ${fileValue ? "has-file" : ""}`}>
        <input type="file" accept={accept} onChange={(e) => onFileChange(e.target.files?.[0] || null)} />
        <div className="upload-icon-wrap">{previewUrl ? <Image size={20} /> : <Upload size={20} />}</div>
        <strong>{label}</strong>
        <small>{fileValue ? "Click to replace file" : "Click to upload"}</small>
      </label>
      {fileValue && (
        <div className="file-pill">
          <span>{fileValue.name}</span>
          <button type="button" className="icon-btn" onClick={() => onFileChange(null)} aria-label={`Remove ${label}`}>
            <Trash2 size={16} />
          </button>
        </div>
      )}
      {previewUrl && (
        <div className="preview-box">
          <img src={previewUrl} alt={`${label} preview`} />
        </div>
      )}
      {fileValue && !previewUrl && (
        <div className="file-hint">
          <FileText size={14} />
          <span>Preview not available for this file type</span>
        </div>
      )}
    </div>
  );
}
