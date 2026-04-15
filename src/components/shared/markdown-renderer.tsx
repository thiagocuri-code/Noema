"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

export function MarkdownRenderer({ content, className = "" }: { content: string; className?: string }) {
  return (
    <div className={`prose prose-sm max-w-none prose-headings:text-[#1a1a2e] prose-headings:font-bold prose-p:text-[#1a1a2e] prose-p:leading-relaxed prose-strong:text-[#071245] prose-li:text-[#1a1a2e] prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-table:text-sm prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
