# Drive Frontend (Next.js)

The frontend is a Next.js application designed to closely mimic the Google Drive user interface.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Ensure your `.env.local` points to your backend:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Roles

The login page has a Master/Viewer switch. Master just enters the master password - there's no username, it's always "you". Viewer enters their own name (anything - it's just a label, not an account) plus the one shared viewer password. Sessions last 1 hour, after which the app signs you back out automatically and you re-enter the password.

After login the UI adapts: Viewers don't see the "+ New" button, upload controls, or rename/move/delete actions - they only get Preview/Open/Download. Master additionally gets a "Logs" button in the top bar showing every Viewer login (name + timestamp), and a lock icon in the folder context menu to mark/unmark any folder as private at any time, not just when creating it. This is a UX convenience only; the backend enforces every rule independently, so a Viewer poking the API directly still gets rejected. See the root [README](../README.md#roles--private-folders) and [backend README](../backend/README.md#role-based-access-control) for the full model.

## Notes

Notes are rich text documents edited in place with a [Tiptap](https://tiptap.dev)/ProseMirror editor, chosen because it's a well-maintained React-native editor that renders entirely client-side - the self-hosted backend does zero text rendering - and produces a structured JSON document rather than raw HTML, which is what's actually validated and stored (see [backend/README.md](../backend/README.md#notes-rich-text-documents)). The code is split by concern: `lib/noteEditorExtensions.js` is the single place the Tiptap schema is configured (shared by edit and read-only rendering), `lib/notePdfExport.js` renders the PDF, `components/NoteEditorModal.jsx` loads the note and `NoteEditorBody.jsx` owns editing/autosave state, and the toolbar itself is composed from small pieces under `components/notes/` (`ToolbarButton`, `ColorMenu`, `ParagraphStyleSelect`, `LinkMenu`).

- **Master** clicks "New note" in the "+ New" menu to create one (default title "Untitled Document") and lands directly in edit mode with a Google Docs-style toolbar: a paragraph-style dropdown (Normal text / Heading 1-3), bold/italic/underline/strikethrough, text color and highlight color pickers, a link button (only `http(s)`/`mailto` URLs are accepted, both client-side and, authoritatively, on the backend), left/center/right/justify alignment, bullet/numbered/checklist lists, and undo/redo. Typing autosaves on a ~1.5s debounce with a "Saving…"/"Saved" indicator; a Save button is also there for peace of mind, and closing the note flushes any pending save first so nothing typed is ever lost.
- **Viewer** opens the same note in a read-only view - the editor is mounted with `editable: false` (never via `dangerouslySetInnerHTML`, which sidesteps XSS entirely), no toolbar or editable title, plus a **Download as PDF** button.
- The PDF download is generated entirely client-side from the note's Tiptap JSON with [jsPDF](https://github.com/parallax/jsPDF) - real, selectable PDF text with the note's formatting preserved (bold/italic/underline/strike, colors, headings, lists, checkboxes, clickable links), not a screenshot. A note inside a private folder is invisible to a Viewer exactly like a private photo or video.
- Notes appear in the folder grid/list next to files with their own document icon; list view also shows a one-line plaintext preview snippet, the same way Google Drive previews a Doc.

## Deployment (Vercel)

This frontend is designed to be deployed to Vercel for free with zero configuration.

1. Push this repository to GitHub.
2. Import the project into Vercel. Ensure you select the `frontend` directory as the Root Directory.
3. In the Environment Variables section, add:
   - `NEXT_PUBLIC_API_BASE_URL`: The HTTPS URL of your Raspberry Pi (e.g., `https://mydrive.duckdns.org`).
4. Deploy! The frontend will now communicate securely with your self-hosted backend.
