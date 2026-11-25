import React, { useState } from 'react';
import { Copy, Check, Sparkles, Code2 } from 'lucide-react';

const LANGUAGE_LABELS = {
  cpp: 'C++',
  'c++': 'C++',
  py: 'Python',
  python: 'Python',
  js: 'JavaScript',
  javascript: 'JavaScript',
  sql: 'SQL',
  java: 'Java',
  ts: 'TypeScript',
};

const KEYWORDS = new Set([
  'int', 'long', 'double', 'float', 'bool', 'char', 'void', 'string', 'auto', 'const',
  'vector', 'unordered_map', 'map', 'set', 'pair', 'class', 'struct', 'public', 'private',
  'return', 'if', 'else', 'for', 'while', 'do', 'break', 'continue', 'switch', 'case',
  'def', 'import', 'from', 'as', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'self',
  'function', 'let', 'var', 'async', 'await', 'try', 'catch', 'new', 'export', 'default',
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'GROUP', 'BY', 'ORDER', 'HAVING',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'INDEX', 'ON', 'AS',
  'select', 'from', 'where', 'join', 'group', 'by', 'order', 'having', 'count', 'distinct',
  'include', 'using', 'namespace', 'std', 'cout', 'cin', 'endl', 'max', 'min', 'true', 'false'
]);

function highlightLine(line) {
  // Handle single-line comments first
  const commentIdx = (() => {
    const slashIdx = line.indexOf('//');
    const hashIdx = line.indexOf('#');
    const sqlIdx = line.indexOf('--');
    const candidates = [slashIdx, hashIdx, sqlIdx].filter((i) => i !== -1);
    if (candidates.length === 0) return -1;
    // Ignore #include preprocessor slightly or highlight nicely
    if (line.trim().startsWith('#include')) return -1;
    return Math.min(...candidates);
  })();

  const codePart = commentIdx !== -1 ? line.slice(0, commentIdx) : line;
  const commentPart = commentIdx !== -1 ? line.slice(commentIdx) : '';

  // Tokenize strings, words, numbers, symbols safely
  const tokenRegex = /("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|#include)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(codePart)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`p_${keyIdx++}`}>{codePart.slice(lastIndex, match.index)}</span>);
    }
    const token = match[0];
    if (token.startsWith('"') || token.startsWith("'")) {
      parts.push(<span key={`p_${keyIdx++}`} className="text-emerald-300">{token}</span>);
    } else if (token === '#include') {
      parts.push(<span key={`p_${keyIdx++}`} className="text-pink-400 font-semibold">{token}</span>);
    } else if (/^\d/.test(token)) {
      parts.push(<span key={`p_${keyIdx++}`} className="text-amber-300">{token}</span>);
    } else if (KEYWORDS.has(token)) {
      parts.push(<span key={`p_${keyIdx++}`} className="text-sky-300 font-semibold">{token}</span>);
    } else {
      parts.push(<span key={`p_${keyIdx++}`}>{token}</span>);
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < codePart.length) {
    parts.push(<span key={`p_${keyIdx++}`}>{codePart.slice(lastIndex)}</span>);
  }

  if (commentPart) {
    parts.push(<span key={`c_${keyIdx++}`} className="text-slate-400 italic">{commentPart}</span>);
  }

  return parts.length > 0 ? parts : '\u00A0';
}

/**
 * Parses message text into text & fenced ```lang code ``` segments
 */
export function parseMessageSegments(text) {
  if (!text) return [];
  const regex = /```([a-zA-Z0-9+#]*)\n([\s\S]*?)```/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index).trim();
      if (plain) segments.push({ type: 'text', content: plain });
    }
    segments.push({
      type: 'code',
      language: (match[1] || 'cpp').toLowerCase(),
      code: match[2].replace(/\n$/, ''),
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const rest = text.slice(lastIndex).trim();
    if (rest) segments.push({ type: 'text', content: rest });
  }

  return segments;
}

export default function CodeBlock({ language = 'cpp', code = '', onExplainCode }) {
  const [copied, setCopied] = useState(false);

  const normalizedLang = String(language || 'cpp').toLowerCase();
  const badgeLabel = LANGUAGE_LABELS[normalizedLang] || normalizedLang.toUpperCase();

  const handleCopy = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const lines = String(code).split('\n');

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="my-1.5 rounded-xl overflow-hidden border border-slate-700/70 bg-[#0d1117] text-[#e6edf3] shadow-md text-left max-w-full min-w-[240px]"
    >
      {/* Code Header Bar */}
      <div className="px-3 py-1.5 bg-[#161b22] border-b border-slate-700/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-sky-400" />
          <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 text-[10.5px] font-bold tracking-wide uppercase">
            {badgeLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onExplainCode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExplainCode(code, badgeLabel);
              }}
              className="px-2 py-1 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Explain Code / Logic with AI"
            >
              <Sparkles className="w-3 h-3" />
              <span>Explain</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Syntax-Highlighted Code Body */}
      <pre className="p-3 overflow-x-auto text-[12.5px] leading-relaxed font-mono select-text">
        <code>
          {lines.map((line, i) => (
            <div key={i} className="table-row">
              <span className="table-cell pr-3 text-right select-none text-slate-600 text-[11px]">
                {i + 1}
              </span>
              <span className="table-cell whitespace-pre">{highlightLine(line)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
