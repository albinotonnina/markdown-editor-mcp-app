import { useState, useEffect, useMemo, useCallback } from 'react';

export interface CursorPosition {
  line: number;
  column: number;
}

export function useMarkdownEditor() {
  const [content, setContent] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ line: 1, column: 1 });

  const isDirty = content !== savedContent;

  const wordCount = useMemo(() => {
    return content.split(/\s+/).filter(Boolean).length;
  }, [content]);

  const charCount = content.length;

  const lineCount = useMemo(() => {
    return content.split('\n').length;
  }, [content]);

  // Mark content as saved
  const markAsSaved = useCallback(() => {
    setSavedContent(content);
  }, [content]);

  // Auto-save functionality
  useEffect(() => {
    if (!filePath || !isDirty) return;

    const timer = setTimeout(() => {
      // Trigger auto-save event
      window.dispatchEvent(new CustomEvent('editor:auto-save'));
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [content, filePath, isDirty]);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
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
    savedContent,
    setSavedContent,
    markAsSaved,
  };
}
