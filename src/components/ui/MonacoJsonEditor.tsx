// MonacoJsonEditor - JSON editor with syntax highlighting and validation

import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppContext } from '@/contexts/AppContext';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { editor } from 'monaco-editor';

interface MonacoJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidate?: (isValid: boolean, errors: string[]) => void;
  height?: string | number;
  readOnly?: boolean;
  placeholder?: string;
}

export function MonacoJsonEditor({
  value,
  onChange,
  onValidate,
  height = 400,
  readOnly = false,
  placeholder = 'Enter JSON here...',
}: MonacoJsonEditorProps) {
  const { effectiveTheme } = useTheme();
  const { settings } = useAppContext();
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);

  // Determine editor theme based on app theme and settings
  const editorTheme = useMemo(() => {
    // Get editor theme from settings (editorTheme is at top level, not nested)
    const editorThemeSetting = settings?.editorTheme;

    // Explicit dark theme
    if (editorThemeSetting === 'vs-dark' || editorThemeSetting === 'dark') {
      return 'vs-dark';
    }
    // High contrast theme
    if (editorThemeSetting === 'hc-black' || editorThemeSetting === 'high-contrast') {
      return 'hc-black';
    }
    // Explicit light theme (only when explicitly set to 'vs' or 'light', not the default 'vs-light')
    if (editorThemeSetting === 'vs' || editorThemeSetting === 'light') {
      return 'vs';
    }
    // Default behavior ('vs-light' or undefined): follow the app theme
    // This allows the editor to auto-sync with app dark/light mode
    return effectiveTheme === 'dark' ? 'vs-dark' : 'vs';
  }, [settings?.editorTheme, effectiveTheme]);

  // Handle editor mount
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);

    // Configure JSON language settings
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: false,
    });

    // Set up marker change listener for validation feedback
    monaco.editor.onDidChangeMarkers((uris) => {
      const editorUri = editor.getModel()?.uri;
      if (editorUri && uris.some(uri => uri.toString() === editorUri.toString())) {
        const markers = monaco.editor.getModelMarkers({ resource: editorUri });
        const errors = markers
          .filter(marker => marker.severity === monaco.MarkerSeverity.Error)
          .map(marker => `Line ${marker.startLineNumber}: ${marker.message}`);

        onValidate?.(errors.length === 0, errors);
      }
    });

    // Initial validation
    setTimeout(() => {
      const model = editor.getModel();
      if (model) {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const errors = markers
          .filter(marker => marker.severity === monaco.MarkerSeverity.Error)
          .map(marker => `Line ${marker.startLineNumber}: ${marker.message}`);

        onValidate?.(errors.length === 0, errors);
      }
    }, 100);
  };

  // Handle value changes
  const handleChange: OnChange = useCallback((newValue) => {
    onChange(newValue || '');
  }, [onChange]);

  // Format document on Ctrl+Shift+F
  useEffect(() => {
    if (!isEditorReady || !editorRef.current) return;

    const editor = editorRef.current;

    // Add format action
    editor.addAction({
      id: 'format-json',
      label: 'Format JSON',
      keybindings: [
        // Ctrl+Shift+F
        (monacoRef.current?.KeyMod.CtrlCmd || 0) |
        (monacoRef.current?.KeyMod.Shift || 0) |
        (monacoRef.current?.KeyCode.KeyF || 0),
      ],
      run: () => {
        editor.getAction('editor.action.formatDocument')?.run();
      },
    });
  }, [isEditorReady]);

  return (
    <div
      className="border rounded overflow-hidden"
      style={{
        borderColor: 'var(--color-border)',
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    >
      <Editor
        height="100%"
        defaultLanguage="json"
        value={value}
        theme={editorTheme}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          folding: true,
          foldingHighlight: true,
          bracketPairColorization: { enabled: true },
          renderLineHighlight: 'line',
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          padding: { top: 8, bottom: 8 },
          placeholder,
        }}
        loading={
          <div
            className="flex items-center justify-center h-full"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div
              className="animate-spin rounded-full h-6 w-6 border-b-2"
              style={{ borderColor: 'var(--color-primary)' }}
            />
            <span
              className="ml-2"
              style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}
            >
              Loading editor...
            </span>
          </div>
        }
      />
    </div>
  );
}
