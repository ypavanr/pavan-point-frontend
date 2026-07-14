// Text-based PDF export, built directly from the note's ProseMirror JSON
// with jsPDF - not a DOM screenshot. A screenshot pipeline (html2canvas)
// was tried first and dropped: it can't parse the modern CSS color
// functions (oklch/lab) that Tailwind v4 emits for computed styles, so it
// threw on every export. Walking the JSON ourselves also produces a real
// text-based PDF (selectable/searchable, small file size, crisp at any
// zoom) instead of a rasterized image - closer to what "preserve the
// formatting" should mean. All of this runs client-side; the Pi backend
// never sees it.
const FONT = 'helvetica';
const BASE_FONT_SIZE = 11;
const LINE_HEIGHT_MULT = 1.35;
const MARGIN = 56; // pt
const HEADING_SIZES = { 1: 20, 2: 16, 3: 13 };
const LIST_INDENT = 18; // pt per nesting level
const CHECKBOX_SIZE = 8;
const DEFAULT_COLOR = [31, 41, 55]; // #1f2937
const MUTED_COLOR = [156, 163, 175]; // #9ca3af, matches checked-task styling on screen
const LINK_COLOR = [37, 99, 235]; // #2563eb

function hexToRgb(hex) {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const num = parseInt(h, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function marksToStyle(marks) {
    const style = { bold: false, italic: false, underline: false, strike: false, color: null, highlight: null, link: null };
    for (const m of marks || []) {
        if (m.type === 'bold') style.bold = true;
        if (m.type === 'italic') style.italic = true;
        if (m.type === 'underline') style.underline = true;
        if (m.type === 'strike') style.strike = true;
        if (m.type === 'textStyle' && m.attrs?.color) style.color = m.attrs.color;
        if (m.type === 'highlight' && m.attrs?.color) style.highlight = m.attrs.color;
        if (m.type === 'link' && m.attrs?.href) style.link = m.attrs.href;
    }
    return style;
}

// Flattens a paragraph/heading's inline content into word/space/break tokens,
// each word carrying the resolved style of the text run it came from.
function tokenizeInline(node) {
    const tokens = [];
    for (const child of node.content || []) {
        if (child.type === 'hardBreak') {
            tokens.push({ type: 'break' });
            continue;
        }
        if (child.type !== 'text' || !child.text) continue;
        const style = marksToStyle(child.marks);
        for (const piece of child.text.split(/(\s+)/)) {
            if (piece === '') continue;
            if (/^\s+$/.test(piece)) tokens.push({ type: 'space' });
            else tokens.push({ type: 'word', text: piece, ...style });
        }
    }
    return tokens;
}

function fontStyleFor(token) {
    if (token.bold && token.italic) return 'bolditalic';
    if (token.bold) return 'bold';
    if (token.italic) return 'italic';
    return 'normal';
}

function measureWord(doc, token, fontSize) {
    doc.setFont(FONT, fontStyleFor(token));
    doc.setFontSize(fontSize);
    return doc.getTextWidth(token.text);
}

// Greedy line-breaking over the flattened tokens, done as its own pass so
// alignment (center/right/justify) can be computed per finished line before
// anything is drawn.
function layoutLines(doc, tokens, { fontSize, maxWidth }) {
    const spaceWidth = (() => {
        doc.setFont(FONT, 'normal');
        doc.setFontSize(fontSize);
        return doc.getTextWidth(' ');
    })();

    const lines = [];
    let current = [];
    let width = 0;

    const pushLine = () => {
        lines.push({ tokens: current, width });
        current = [];
        width = 0;
    };

    for (const token of tokens) {
        if (token.type === 'break') {
            pushLine();
            continue;
        }
        if (token.type === 'space') {
            if (current.length > 0) current.push(token);
            width += spaceWidth;
            continue;
        }
        const w = measureWord(doc, token, fontSize);
        if (current.length > 0 && width + w > maxWidth) {
            // Drop a trailing space token before wrapping.
            if (current[current.length - 1]?.type === 'space') {
                width -= spaceWidth;
                current.pop();
            }
            pushLine();
        }
        current.push(token);
        width += w;
    }
    if (current.length > 0) pushLine();
    return { lines, spaceWidth };
}

function drawLine(doc, line, { x, y, fontSize, align, maxWidth, spaceWidth, isLastLine }) {
    const gapCount = line.tokens.filter((t) => t.type === 'space').length;

    let startX = x;
    let extraGap = 0;
    if (align === 'center') startX = x + (maxWidth - line.width) / 2;
    else if (align === 'right') startX = x + (maxWidth - line.width);
    else if (align === 'justify' && !isLastLine && gapCount > 0) {
        extraGap = (maxWidth - line.width) / gapCount;
    }

    let cursorX = startX;
    for (const token of line.tokens) {
        if (token.type === 'space') {
            cursorX += spaceWidth + extraGap;
            continue;
        }
        const style = fontStyleFor(token);
        doc.setFont(FONT, style);
        doc.setFontSize(fontSize);
        const w = doc.getTextWidth(token.text);

        const isMuted = token.__muted;
        const rgb = isMuted ? MUTED_COLOR : (token.link ? LINK_COLOR : (hexToRgb(token.color) || DEFAULT_COLOR));

        if (token.highlight && !isMuted) {
            const hl = hexToRgb(token.highlight);
            if (hl) {
                doc.setFillColor(hl[0], hl[1], hl[2]);
                doc.rect(cursorX, y - fontSize * 0.8, w, fontSize * 1.05, 'F');
            }
        }

        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        doc.text(token.text, cursorX, y);

        if (token.underline || token.link) {
            doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
            doc.line(cursorX, y + fontSize * 0.12, cursorX + w, y + fontSize * 0.12);
        }
        if (token.strike || isMuted) {
            doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
            doc.line(cursorX, y - fontSize * 0.32, cursorX + w, y - fontSize * 0.32);
        }
        if (token.link) {
            doc.link(cursorX, y - fontSize * 0.8, w, fontSize * 1.05, { url: token.link });
        }

        cursorX += w;
    }
}

class PdfWriter {
    constructor(doc) {
        this.doc = doc;
        this.pageWidth = doc.internal.pageSize.getWidth();
        this.pageHeight = doc.internal.pageSize.getHeight();
        this.contentWidth = this.pageWidth - MARGIN * 2;
        this.y = MARGIN;
    }

    ensureSpace(height) {
        if (this.y + height > this.pageHeight - MARGIN) {
            this.doc.addPage();
            this.y = MARGIN;
        }
    }

    spacer(height) {
        this.y += height;
    }

    writeParagraphLike(node, { fontSize, align = 'left', indent = 0, muted = false }) {
        const tokens = tokenizeInline(node).map((t) => (muted ? { ...t, __muted: true } : t));
        const maxWidth = this.contentWidth - indent;
        const { lines, spaceWidth } = layoutLines(this.doc, tokens, { fontSize, maxWidth });
        const lineHeight = fontSize * LINE_HEIGHT_MULT;

        if (lines.length === 0) {
            this.ensureSpace(lineHeight);
            this.y += lineHeight;
            return;
        }

        lines.forEach((line, i) => {
            this.ensureSpace(lineHeight);
            this.y += fontSize;
            drawLine(this.doc, line, {
                x: MARGIN + indent,
                y: this.y,
                fontSize,
                align,
                maxWidth,
                spaceWidth,
                isLastLine: i === lines.length - 1,
            });
            this.y += lineHeight - fontSize;
        });
    }

    writeListMarker(marker, { indent, fontSize }) {
        this.doc.setFont(FONT, 'normal');
        this.doc.setFontSize(fontSize);
        this.doc.setTextColor(...DEFAULT_COLOR);
        this.doc.text(marker, MARGIN + indent - LIST_INDENT + 4, this.y + fontSize);
    }

    writeCheckbox(checked, { indent, fontSize }) {
        const boxX = MARGIN + indent - LIST_INDENT + 4;
        const boxY = this.y + fontSize - CHECKBOX_SIZE + 1;
        this.doc.setDrawColor(...DEFAULT_COLOR);
        if (checked) this.doc.setFillColor(37, 99, 235);
        this.doc.rect(boxX, boxY, CHECKBOX_SIZE, CHECKBOX_SIZE, checked ? 'FD' : 'D');
        if (checked) {
            this.doc.setDrawColor(255, 255, 255);
            this.doc.line(boxX + 1.5, boxY + 4, boxX + 3.2, boxY + 6.5);
            this.doc.line(boxX + 3.2, boxY + 6.5, boxX + 6.5, boxY + 1.5);
        }
    }
}

function renderBlock(writer, node, { indent = 0 } = {}) {
    switch (node.type) {
        case 'heading': {
            const level = node.attrs?.level || 1;
            const fontSize = HEADING_SIZES[level] || HEADING_SIZES[3];
            writer.ensureSpace(fontSize * LINE_HEIGHT_MULT + 6);
            writer.spacer(6);
            writer.writeParagraphLike(node, { fontSize, align: node.attrs?.textAlign || 'left', indent });
            writer.spacer(2);
            break;
        }
        case 'paragraph': {
            writer.writeParagraphLike(node, { fontSize: BASE_FONT_SIZE, align: node.attrs?.textAlign || 'left', indent });
            writer.spacer(4);
            break;
        }
        case 'bulletList': {
            for (const item of node.content || []) {
                renderListItem(writer, item, { indent: indent + LIST_INDENT, marker: '•' });
            }
            writer.spacer(4);
            break;
        }
        case 'orderedList': {
            (node.content || []).forEach((item, i) => {
                renderListItem(writer, item, { indent: indent + LIST_INDENT, marker: `${i + 1}.` });
            });
            writer.spacer(4);
            break;
        }
        case 'taskList': {
            for (const item of node.content || []) {
                renderListItem(writer, item, { indent: indent + LIST_INDENT, checked: !!item.attrs?.checked });
            }
            writer.spacer(4);
            break;
        }
        default:
            break;
    }
}

function renderListItem(writer, item, { indent, marker, checked }) {
    const firstBlock = (item.content || [])[0];
    if (firstBlock && (firstBlock.type === 'paragraph' || firstBlock.type === 'heading')) {
        const fontSize = firstBlock.type === 'heading' ? (HEADING_SIZES[firstBlock.attrs?.level] || BASE_FONT_SIZE) : BASE_FONT_SIZE;
        writer.ensureSpace(fontSize * LINE_HEIGHT_MULT);
        if (marker) writer.writeListMarker(marker, { indent, fontSize });
        if (checked !== undefined) writer.writeCheckbox(checked, { indent, fontSize });
        writer.writeParagraphLike(firstBlock, { fontSize, align: firstBlock.attrs?.textAlign || 'left', indent, muted: checked });
    }
    // Any remaining blocks in the list item (nested lists, extra paragraphs).
    for (const block of (item.content || []).slice(1)) {
        renderBlock(writer, block, { indent });
    }
}

export function sanitizeFilename(name) {
    return (name || '').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 150) || 'note';
}

export async function exportNoteAsPdf({ title, contentJson, filename }) {
    if (!contentJson) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const writer = new PdfWriter(doc);

    const displayTitle = title || 'Untitled Document';
    doc.setFont(FONT, 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...DEFAULT_COLOR);
    doc.text(displayTitle, MARGIN, writer.y + 22);
    writer.y += 30;
    doc.setDrawColor(229, 231, 235);
    doc.line(MARGIN, writer.y, writer.pageWidth - MARGIN, writer.y);
    writer.y += 20;

    for (const block of contentJson.content || []) {
        renderBlock(writer, block);
    }

    doc.save(`${sanitizeFilename(filename || title)}.pdf`);
}
