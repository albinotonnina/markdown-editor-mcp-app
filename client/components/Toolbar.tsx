interface ToolbarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExport: (format: 'html' | 'pdf' | 'text') => void;
  onImport: (format: 'html') => void;
  isDirty: boolean;
  filePath: string | null;
}

export function Toolbar({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExport,
  onImport,
  isDirty,
  filePath,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <button onClick={onNew} className="toolbar-btn" title="New file">
          New
        </button>
        <button onClick={onOpen} className="toolbar-btn" title="Open file">
          Open
        </button>
        <button onClick={onSave} className="toolbar-btn" title="Save (Ctrl+S)" disabled={!isDirty && !!filePath}>
          Save{isDirty && '*'}
        </button>
        <button onClick={onSaveAs} className="toolbar-btn" title="Save As">
          Save As
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <div className="toolbar-dropdown">
          <button className="toolbar-btn">Export ▾</button>
          <div className="toolbar-dropdown-content">
            <button onClick={() => onExport('html')}>HTML</button>
            <button onClick={() => onExport('pdf')}>PDF</button>
            <button onClick={() => onExport('text')}>Plain Text</button>
          </div>
        </div>

        <div className="toolbar-dropdown">
          <button className="toolbar-btn">Import ▾</button>
          <div className="toolbar-dropdown-content">
            <button onClick={() => onImport('html')}>HTML</button>
          </div>
        </div>
      </div>

      <div className="toolbar-section toolbar-file-info">
        {filePath && <span className="file-path">{filePath}</span>}
        {!filePath && <span className="file-path">Untitled</span>}
      </div>
    </div>
  );
}
