import React, { useRef, useState } from 'react';
import { fileUrl } from './constants';

interface Props {
  patientId: string;
  documents: any[];
  onRefresh: () => void;
  onAlert: (msg: { type: 'success' | 'error' | 'warning' | 'info'; text: string } | null) => void;
  onConfirm: (dialog: { message: string; onConfirm: () => void; danger?: boolean } | null) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
};

const getFileIcon = (mimeType: string) => {
  if (mimeType?.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  return '📎';
};

const PatientDocumentsTab: React.FC<Props> = ({ patientId, documents, onRefresh, onAlert, onConfirm }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { doctorAPI } = await import('../../../services/api');
      await doctorAPI.uploadDocument(file, patientId);
      onRefresh();
    } catch (err: any) { onAlert({ type: 'error', text: err.response?.data?.error || "Erreur lors de l'upload" }); }
    finally { setUploading(false); }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) Array.from(files).forEach(f => uploadFile(f));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files) Array.from(files).forEach(f => uploadFile(f));
  };

  const deleteDoc = async (docId: string) => {
    onConfirm({
      message: 'Supprimer ce document ?',
      onConfirm: async () => {
        try {
          const { doctorAPI } = await import('../../../services/api');
          await doctorAPI.deleteDocument(docId);
          onRefresh();
        } catch { onAlert({ type: 'error', text: 'Erreur lors de la suppression' }); }
      }
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Documents</span>
        <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
          {uploading ? 'Envoi en cours...' : '+ Ajouter un document'}
        </button>
      </div>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileInput}
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx" />
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{ border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: 30, textAlign: 'center', marginBottom: 16, background: dragOver ? 'var(--primary-light)' : 'transparent', transition: 'all 0.15s' }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
        <p className="text-muted text-sm">Glissez-déposez vos fichiers ici</p>
        <p className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>PDF, Images, Word — Max 20 Mo</p>
      </div>
      {!documents.length ? (
        <div className="empty-state" style={{ padding: '20px 0' }}><div className="empty-icon">📄</div><p>Aucun document</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {documents.map((doc: any) => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 22 }}>{getFileIcon(doc.mimeType)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{doc.name}</div>
                <div className="text-muted text-sm">{doc.type} · {doc.size ? formatFileSize(doc.size) : '—'}</div>
              </div>
              <a href={fileUrl(doc.url)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Voir</a>
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: '#f5c6c3' }} onClick={() => deleteDoc(doc.id)}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientDocumentsTab;
