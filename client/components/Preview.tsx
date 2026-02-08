import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface PreviewProps {
  content: string;
}

export function Preview({ content }: PreviewProps) {
  return (
    <div className="preview-container">
      <div className="preview-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={{
            // Custom code block rendering with syntax highlighting
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            // Custom task list rendering
            input({ node, checked, ...props }: any) {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled
                  {...props}
                />
              );
            },
            // Custom table rendering
            table({ children }: any) {
              return (
                <div className="table-wrapper">
                  <table>{children}</table>
                </div>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
