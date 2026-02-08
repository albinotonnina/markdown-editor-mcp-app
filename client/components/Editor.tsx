import Editor from '@monaco-editor/react';
import { useRef } from 'react';
import type { CursorPosition } from '../hooks/useMarkdownEditor';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onCursorPositionChange?: (position: CursorPosition) => void;
}

export function MarkdownEditor({ value, onChange, onCursorPositionChange }: EditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Track cursor position
    editor.onDidChangeCursorPosition((e: any) => {
      onCursorPositionChange?.({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Custom keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Trigger save
      window.dispatchEvent(new CustomEvent('editor:save'));
    });

    // Markdown-specific configurations
    monaco.languages.setLanguageConfiguration('markdown', {
      wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className="editor-container">
      <Editor
        height="100%"
        language="markdown"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          wordWrap: 'on',
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          // Markdown-specific settings
          links: true,
          folding: true,
          renderWhitespace: 'selection',
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
}
