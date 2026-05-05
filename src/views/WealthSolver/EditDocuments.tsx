import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useWealthSolver } from '@/context/WealthSolverContext';
import { DOCUMENT_TYPES } from '@/types/wealthsolver';
import type { WsPlan } from '@/types/wealthsolver';

interface Props {
  plan: WsPlan;
}

export function EditDocuments({ plan }: Props) {
  const { dispatch } = useWealthSolver();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [docType, setDocType] = useState<string>(DOCUMENT_TYPES[0]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(file.size);
    }
  }

  function handleUpload() {
    if (!fileName.trim()) return;
    dispatch({
      type: 'ADD_DOCUMENT',
      planId: plan.id,
      doc: { id: Date.now(), name: fileName, type: docType, size: fileSize },
    });
    setFileName('');
    setFileSize(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleRemove(docId: number) {
    dispatch({ type: 'REMOVE_DOCUMENT', planId: plan.id, docId });
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-base font-semibold mb-4">Edit Product Documents — {plan.name}</h2>

      {/* Additional Product Documents */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-white bg-navy px-3 py-1.5 rounded-t">
          Additional Product Documents
        </h3>
        <div className="border border-t-0 border-border rounded-b">
          {plan.documents.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground italic">No uploaded documents</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Document name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {plan.documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-teal-700">{doc.name}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{doc.type}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                        onClick={() => handleRemove(doc.id)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Upload Document */}
      <div>
        <h3 className="text-sm font-semibold text-white bg-navy px-3 py-1.5 rounded-t">
          Upload Document
        </h3>
        <div className="border border-t-0 border-border rounded-b p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
            <span className="text-sm text-muted-foreground">{fileName || 'No file chosen'}</span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-12 flex-shrink-0">Type</label>
            <select
              className="border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <Button
            className="bg-teal-700 hover:bg-teal-800 text-white h-8 text-sm"
            disabled={!fileName.trim()}
            onClick={handleUpload}
          >
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}
