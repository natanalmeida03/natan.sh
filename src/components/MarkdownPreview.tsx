"use client";

import type { ReactNode } from "react";

interface MarkdownPreviewProps {
    content: string;
    emptyMessage?: string;
    className?: string;
}

const INLINE_PATTERN =
    /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(~~([^~]+)~~)|(\*([^*]+)\*)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    INLINE_PATTERN.lastIndex = 0;

    while ((match = INLINE_PATTERN.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        if (match[1]) {
            nodes.push(
                <a
                    key={`${keyPrefix}-${match.index}`}
                    href={match[3]}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 text-accent break-all"
                >
                    {match[2]}
                </a>
            );
        } else if (match[4]) {
            nodes.push(
                <code
                    key={`${keyPrefix}-${match.index}`}
                    className="px-1.5 py-0.5 rounded bg-foreground/6 text-[0.95em]"
                >
                    {match[5]}
                </code>
            );
        } else if (match[6]) {
            nodes.push(
                <strong key={`${keyPrefix}-${match.index}`}>{match[7]}</strong>
            );
        } else if (match[8]) {
            nodes.push(
                <span
                    key={`${keyPrefix}-${match.index}`}
                    className="line-through opacity-70"
                >
                    {match[9]}
                </span>
            );
        } else if (match[10]) {
            nodes.push(
                <em key={`${keyPrefix}-${match.index}`}>{match[11]}</em>
            );
        }

        lastIndex = INLINE_PATTERN.lastIndex;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}

function renderListItems(
    lines: string[],
    startIndex: number,
    ordered: boolean
): { element: ReactNode; nextIndex: number } {
    const items: ReactNode[] = [];
    let index = startIndex;
    const pattern = ordered ? /^\d+\.\s+(.*)$/ : /^[-*+]\s+(.*)$/;

    while (index < lines.length) {
        const match = lines[index].match(pattern);

        if (!match) {
            break;
        }

        items.push(
            <li key={`list-item-${index}`}>{renderInline(match[1], `list-${index}`)}</li>
        );
        index += 1;
    }

    const Wrapper = ordered ? "ol" : "ul";

    return {
        element: (
            <Wrapper
                key={`list-${startIndex}`}
                className={`pl-5 ${ordered ? "list-decimal" : "list-disc"} space-y-1`}
            >
                {items}
            </Wrapper>
        ),
        nextIndex: index,
    };
}

function renderHeading(
    level: number,
    key: string,
    content: ReactNode[]
): ReactNode {
    const classNameMap = [
        "text-3xl font-semibold text-foreground",
        "text-2xl font-semibold text-foreground",
        "text-xl font-semibold text-foreground",
        "text-lg font-semibold text-foreground",
        "text-base font-semibold text-foreground",
        "text-sm font-semibold text-foreground",
    ];
    const className = classNameMap[level - 1] || classNameMap[5];

    switch (level) {
        case 1:
            return (
                <h1 key={key} className={className}>
                    {content}
                </h1>
            );
        case 2:
            return (
                <h2 key={key} className={className}>
                    {content}
                </h2>
            );
        case 3:
            return (
                <h3 key={key} className={className}>
                    {content}
                </h3>
            );
        case 4:
            return (
                <h4 key={key} className={className}>
                    {content}
                </h4>
            );
        case 5:
            return (
                <h5 key={key} className={className}>
                    {content}
                </h5>
            );
        default:
            return (
                <h6 key={key} className={className}>
                    {content}
                </h6>
            );
    }
}

export default function MarkdownPreview({
    content,
    emptyMessage = "Nothing to preview yet.",
    className = "",
}: MarkdownPreviewProps) {
    if (!content.trim()) {
        return (
            <div
                className={`rounded-lg border border-dashed border-foreground/15 bg-foreground/2 px-4 py-5 text-sm italic text-foreground/35 ${className}`}
            >
                {emptyMessage}
            </div>
        );
    }

    const lines = content.replace(/\r\n/g, "\n").split("\n");
    const elements: ReactNode[] = [];

    for (let index = 0; index < lines.length; ) {
        const line = lines[index];
        const trimmed = line.trim();

        if (!trimmed) {
            index += 1;
            continue;
        }

        if (trimmed.startsWith("```")) {
            const codeLines: string[] = [];
            index += 1;

            while (index < lines.length && !lines[index].trim().startsWith("```")) {
                codeLines.push(lines[index]);
                index += 1;
            }

            if (index < lines.length) {
                index += 1;
            }

            elements.push(
                <pre
                    key={`code-${index}`}
                    className="overflow-x-auto rounded-lg border border-foreground/10 bg-foreground/6 p-3 text-xs text-foreground/80"
                >
                    <code>{codeLines.join("\n")}</code>
                </pre>
            );
            continue;
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);

        if (headingMatch) {
            const level = headingMatch[1].length;
            elements.push(
                renderHeading(
                    level,
                    `heading-${index}`,
                    renderInline(headingMatch[2], `heading-${index}`)
                )
            );
            index += 1;
            continue;
        }

        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            elements.push(
                <hr key={`hr-${index}`} className="border-0 border-t border-foreground/10" />
            );
            index += 1;
            continue;
        }

        if (trimmed.startsWith(">")) {
            const quoteLines: string[] = [];

            while (index < lines.length && lines[index].trim().startsWith(">")) {
                quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
                index += 1;
            }

            elements.push(
                <blockquote
                    key={`quote-${index}`}
                    className="border-l-2 border-foreground/20 pl-4 italic text-foreground/70"
                >
                    {quoteLines.map((quoteLine, quoteIndex) => (
                        <p key={`quote-line-${quoteIndex}`}>
                            {renderInline(quoteLine, `quote-${index}-${quoteIndex}`)}
                        </p>
                    ))}
                </blockquote>
            );
            continue;
        }

        if (/^[-*+]\s+/.test(trimmed)) {
            const { element, nextIndex } = renderListItems(lines, index, false);
            elements.push(element);
            index = nextIndex;
            continue;
        }

        if (/^\d+\.\s+/.test(trimmed)) {
            const { element, nextIndex } = renderListItems(lines, index, true);
            elements.push(element);
            index = nextIndex;
            continue;
        }

        const paragraphLines = [trimmed];
        index += 1;

        while (
            index < lines.length &&
            lines[index].trim() &&
            !lines[index].trim().startsWith("```") &&
            !/^(#{1,6})\s+/.test(lines[index].trim()) &&
            !/^>\s?/.test(lines[index].trim()) &&
            !/^[-*+]\s+/.test(lines[index].trim()) &&
            !/^\d+\.\s+/.test(lines[index].trim()) &&
            !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[index].trim())
        ) {
            paragraphLines.push(lines[index].trim());
            index += 1;
        }

        elements.push(
            <p key={`paragraph-${index}`} className="leading-7 text-foreground/80">
                {renderInline(paragraphLines.join(" "), `paragraph-${index}`)}
            </p>
        );
    }

    return <div className={`flex flex-col gap-4 font-mono text-sm ${className}`}>{elements}</div>;
}
