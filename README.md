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

Notes are rich text documents edited in place with a [Tiptap](https://tiptap.dev)/ProseMirror editor (`components/NoteEditorModal.jsx`), chosen because it's a well-maintained React-native editor that renders entirely client-side - the self-hosted backend does zero text rendering - and produces a structured JSON document rather than raw HTML, which is what's actually validated and stored (see [backend/README.md](../backend/README.md#notes-rich-text-documents)).

- **Master** clicks "New note" in the "+ New" menu to create one (default title "Untitled note") and lands directly in edit mode with the formatting toolbar (bold/italic/underline/strike, highlight, alignment, headings 1-3, bullet/numbered lists, undo/redo). Typing autosaves on a ~1.5s debounce with a "Saving…"/"Saved" indicator; a Save button is also there for peace of mind, and closing the note flushes any pending save first so nothing typed is ever lost.
- **Viewer** opens the same note in a read-only view - the editor is mounted with `editable: false` (never via `dangerouslySetInnerHTML`, which sidesteps XSS entirely), no toolbar or editable title, plus a Download-as-`.txt` button. A note inside a private folder is invisible to a Viewer exactly like a private photo or video.
- Notes appear in the folder grid/list next to files with their own document icon; list view also shows a one-line plaintext preview snippet, the same way Google Drive previews a Doc.

## Deployment (Vercel)

This frontend is designed to be deployed to Vercel for free with zero configuration.

1. Push this repository to GitHub.
2. Import the project into Vercel. Ensure you select the `frontend` directory as the Root Directory.
3. In the Environment Variables section, add:
   - `NEXT_PUBLIC_API_BASE_URL`: The HTTPS URL of your Raspberry Pi (e.g., `https://mydrive.duckdns.org`).
4. Deploy! The frontend will now communicate securely with your self-hosted backend.
