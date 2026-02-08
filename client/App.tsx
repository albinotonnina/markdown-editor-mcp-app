import { useEffect } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import { MarkdownEditor } from './components/Editor';
import { Preview } from './components/Preview';
import { Toolbar } from './components/Toolbar';
import { SplitPane } from './components/SplitPane';
import { useMarkdownEditor } from './hooks/useMarkdownEditor';
import './styles/app.css';

function App() {
  const {
    content,
    setContent,
    filePath,
    setFilePath,
    isDirty,
    wordCount,
    charCount,
    lineCount,
    cursorPosition,
    setCursorPosition,
    setSavedContent,
    markAsSaved,
  } = useMarkdownEditor();

  const { app } = useApp({
    appInfo: {
      name: 'Markdown Editor',
      version: '1.0.0',
    },
    capabilities: {},
    onAppCreated: (app) => {
      // Handle initial content from tool call
      app.ontoolresult = (result) => {
        const structured = result.structuredContent as Record<string, unknown> | undefined;
        if (structured) {
          const newContent = (structured.content as string) || '';
          setContent(newContent);
          setSavedContent(newContent);
          setFilePath((structured.filePath as string) || null);
        }
      };

      // Handle streaming content updates
      app.ontoolinputpartial = (partial) => {
        const args = partial.arguments as Record<string, unknown> | undefined;
        if (args?.content) {
          setContent(args.content as string);
        }
      };
    },
  });

  // File operations
  const handleNew = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to create a new file?')) {
        return;
      }
    }
    setContent('');
    setSavedContent('');
    setFilePath(null);
  };

  const handleOpen = async () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to open a file?')) {
        return;
      }
    }

    // In a real implementation, this would show a file picker dialog
    // For now, prompt for file path
    const path = window.prompt('Enter file path to open:');
    if (!path) return;

    try {
      const result = await app?.callServerTool({
        name: 'open_file',
        arguments: { filePath: path },
      });

      const structured = result?.structuredContent as Record<string, unknown> | undefined;
      if (structured) {
        setContent(structured.content as string);
        setSavedContent(structured.content as string);
        setFilePath(structured.filePath as string);
      }
    } catch (error) {
      alert(`Error opening file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    if (!filePath) {
      return handleSaveAs();
    }

    try {
      await app?.callServerTool({
        name: 'save_file',
        arguments: {
          filePath,
          content,
          createBackup: true,
        },
      });

      markAsSaved();
      alert('File saved successfully');
    } catch (error) {
      alert(`Error saving file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveAs = async () => {
    // In a real implementation, this would show a save dialog
    // For now, prompt for file path
    const path = window.prompt('Enter file path to save:', filePath || 'untitled.md');
    if (!path) return;

    try {
      await app?.callServerTool({
        name: 'save_file',
        arguments: {
          filePath: path,
          content,
          createBackup: false,
        },
      });

      setFilePath(path);
      markAsSaved();
      alert('File saved successfully');
    } catch (error) {
      alert(`Error saving file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExport = async (format: 'html' | 'pdf' | 'text') => {
    const extension = format === 'text' ? 'txt' : format;
    const defaultPath = filePath
      ? filePath.replace(/\.md$/, `.${extension}`)
      : `untitled.${extension}`;

    const outputPath = window.prompt(`Export to ${format.toUpperCase()}:`, defaultPath);
    if (!outputPath) return;

    try {
      await app?.callServerTool({
        name: `export_${format}`,
        arguments: {
          content,
          outputPath,
          ...(format === 'pdf' && { pageSize: 'A4' }),
        },
      });

      alert(`Exported to ${format.toUpperCase()} successfully`);
    } catch (error) {
      alert(`Error exporting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImport = async (format: 'html') => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to import?')) {
        return;
      }
    }

    const path = window.prompt(`Enter path to ${format.toUpperCase()} file:`);
    if (!path) return;

    try {
      const result = await app?.callServerTool({
        name: `import_${format}`,
        arguments: { filePath: path },
      });

      const structured = result?.structuredContent as Record<string, unknown> | undefined;
      if (structured) {
        setContent(structured.content as string);
        setSavedContent('');
        setFilePath(null);
      }
    } catch (error) {
      alert(`Error importing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Listen for save event from editor
  useEffect(() => {
    const handleSaveEvent = () => {
      handleSave();
    };

    window.addEventListener('editor:save', handleSaveEvent);
    return () => window.removeEventListener('editor:save', handleSaveEvent);
  }, [handleSave]);

  return (
    <div className="app">
      <Toolbar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onExport={handleExport}
        onImport={handleImport}
        isDirty={isDirty}
        filePath={filePath}
      />

      <div className="editor-area">
        <SplitPane
          left={
            <MarkdownEditor
              value={content}
              onChange={setContent}
              onCursorPositionChange={setCursorPosition}
            />
          }
          right={<Preview content={content} />}
        />
      </div>

      <div className="status-bar">
        <span>Line {cursorPosition.line}, Col {cursorPosition.column}</span>
        <span>{wordCount} words</span>
        <span>{charCount} characters</span>
        <span>{lineCount} lines</span>
      </div>
    </div>
  );
}

export default App;
