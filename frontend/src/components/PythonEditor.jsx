import { useCallback } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/editor/editor.api';
import 'monaco-editor/languages/definitions/python/register';
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching';
import 'monaco-editor/editor/contrib/comment/browser/comment';
import 'monaco-editor/editor/contrib/indentation/browser/indentation';
import editorWorker from 'monaco-editor/editor/editor.worker?worker';

// Configure local Monaco instance & worker so Python editing works without external CDN dependency
if (typeof window !== 'undefined' && !window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorker() {
      return new editorWorker();
    },
  };
}
loader.config({ monaco });

export default function PythonEditor({ value, onChange, theme = 'dark', readOnly = false }) {
  const handleBeforeMount = useCallback((monacoInstance) => {
    monacoInstance.editor.defineTheme('iv-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '71717A', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'F4F4F5', fontStyle: 'bold' },
        { token: 'string', foreground: '34D399' },
        { token: 'number', foreground: 'FBBF24' },
        { token: 'identifier', foreground: 'E4E4E7' },
      ],
      colors: {
        'editor.background': '#09090B',
        'editor.foreground': '#E4E4E7',
        'editor.lineHighlightBackground': '#141418',
        'editorLineNumber.foreground': '#52525B',
        'editorLineNumber.activeForeground': '#A1A1AA',
        'editor.selectionBackground': '#27272A',
        'editorCursor.foreground': '#F4F4F5',
        'editorIndentGuide.background': '#1F1F23',
      },
    });

    monacoInstance.editor.defineTheme('iv-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '71717A', fontStyle: 'italic' },
        { token: 'string', foreground: '059669' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#18181B',
        'editor.lineHighlightBackground': '#F4F4F5',
        'editorLineNumber.foreground': '#A1A1AA',
        'editorLineNumber.activeForeground': '#3F3F46',
      },
    });
  }, []);

  return (
    <div
      className="w-full h-full min-h-[260px]"
      data-testid="python-monaco-editor"
      data-lenis-prevent
    >
      <Editor
        height="100%"
        defaultLanguage="python"
        language="python"
        theme={theme === 'dark' ? 'iv-dark' : 'iv-light'}
        value={value}
        onChange={(nextVal) => onChange(nextVal ?? '')}
        beforeMount={handleBeforeMount}
        options={{
          readOnly,
          fontSize: 13.5,
          lineHeight: 22,
          fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
          fontLigatures: false,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          tabSize: 4,
          insertSpaces: true,
          automaticLayout: true,
          padding: { top: 14, bottom: 14 },
          overviewRulerBorder: false,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
