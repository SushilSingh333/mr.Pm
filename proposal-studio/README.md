# MrPackerMover — Proposal Studio

A tiny, self-contained web app to create a **premium 2-page A4 moving proposal** (quotation on page 1, terms on page 2) and download it as a PDF. No build step, no server required, no dependencies.

## Files
| File | Purpose |
|------|---------|
| `index.html` | The whole app — structure **and** styling (CSS is inlined so the PDF download works even when you just double-click the file) |
| `app.js` | Form logic, live totals, proposal rendering, in-browser PDF builder |
| `start.bat` | Optional — serves the folder locally and opens your browser |
| `README.md` | This file |

## How to use
1. **Double-click `index.html`** — it opens in your browser. (Or double-click `start.bat` to run it via a local server; both work.)
2. Fill in the form. It's prefilled with a sample so you can see the result immediately — edit any field.
3. Click **Create Proposal** to preview.
4. Click **Download PDF** — a clean, full-page **2-page A4 PDF** saves straight to your Downloads folder.
   - A **Print** button is there too, if you prefer the browser's print dialog (it produces sharper, selectable text).

## Notes
- The PDF is built **entirely in your browser** — nothing is uploaded anywhere.
- Because the styling now lives inside `index.html`, one-click **Download PDF** works whether you open the file directly (`file://`) or serve it. If a browser ever can't build it in-page (older Safari), it automatically falls back to the Print dialog — just choose **Save as PDF** (A4, Margins: None).
- The download is a high-resolution image-based PDF (crisp for printing). For **selectable text**, use **Print → Save as PDF** instead.

## Customising
- **Company details** (name, phone, email, GSTIN, address) are in section 1 of the form — replace the placeholder values with your real ones.
- The **colour theme** is driven by CSS variables at the top of the `<style>` block in `index.html` (`--navy`, `--gold`, `--paper`, …).
- Default inventory items, charges, services and terms live near the top of `app.js` (`defaultItems`, `defaultCharges`, `defaultServices`, `defaultTerms`) if you'd like to change the starting values permanently.

## Browser support
Modern Chrome, Edge, Firefox, and Safari. One-click PDF uses the SVG `foreignObject` → canvas technique; where a browser can't do it, the app falls back to Print automatically.
