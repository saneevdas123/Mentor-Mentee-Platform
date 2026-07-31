/**
 * gradesheetParser — turns a results PDF into structured course lines and maps
 * each course to a CBCS basket.
 *
 * PDF table extraction typically loses the column gaps, so a row like
 *   "CUTM1001Engineering Mathematics IICore4A"
 * arrives as one glued string. We recover it by anchoring on three stable
 * landmarks: the course code at the start, and the credit + grade at the end.
 * Whatever basket the department defined is then found inside the middle text.
 *
 * The parser is deliberately conservative: anything it cannot confidently map
 * is returned unmapped (basket = null) so a mentor can fix it during review.
 * It is pure (no DB) — pass in the department's baskets.
 */

// Grades that earn credit (CUTM 7-point + audit pass marks). Everything else (F, AB, I, W) does not.
const PASSING = new Set(['O', 'E', 'A', 'B', 'C', 'D', 'S', 'P', 'PASS', 'QUALIFIED']);
const GRADE_TOKENS = ['O', 'E', 'A', 'B', 'C', 'D', 'F', 'S', 'P', 'AB', 'I', 'W', 'PASS', 'FAIL', 'QUALIFIED'];

// Course code = letters then digits (e.g. CUTM1001, EACS2010). We intentionally do
// NOT allow a trailing letter here: when columns glue together the next character is
// usually the first letter of the course title, so consuming it would corrupt both.
const COURSE_CODE_RE = /^([A-Z]{2,7}\d{2,4})/;
// credit (int or decimal) followed by a grade token, at end of the string
const TAIL_RE = new RegExp(`(\\d{1,2}(?:\\.\\d{1,2})?)\\s*(${GRADE_TOKENS.join('|')})$`, 'i');

function extractText(buffer) {
  // require the inner module directly to avoid pdf-parse's debug harness reading a test file
  // eslint-disable-next-line global-require
  const pdf = require('pdf-parse/lib/pdf-parse.js');
  return pdf(buffer).then((d) => d.text || '');
}

// Build a longest-first list of {label, basket} alias candidates from the dept baskets.
function aliasIndex(baskets = []) {
  const out = [];
  for (const b of baskets) {
    const labels = [b.name, b.code, ...(b.aliases || [])].filter(Boolean);
    for (const l of labels) out.push({ label: String(l).trim(), norm: normalise(l), basket: b });
  }
  return out.sort((a, b) => b.norm.length - a.norm.length);
}

const normalise = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function matchBasket(middle, aliases) {
  const nm = normalise(middle);
  // Prefer a basket label that sits at the END of the middle text (Title | Basket column order).
  for (const a of aliases) {
    if (a.norm && nm.endsWith(a.norm)) {
      const cut = middle.length - trimmedTailLength(middle, a.norm);
      return { basket: a.basket, label: a.label, title: middle.slice(0, cut).trim() };
    }
  }
  // Then a label at the START (Basket | Title order).
  for (const a of aliases) {
    if (a.norm && nm.startsWith(a.norm)) {
      const cut = trimmedHeadLength(middle, a.norm);
      return { basket: a.basket, label: a.label, title: middle.slice(cut).trim() };
    }
  }
  // Then anywhere inside.
  for (const a of aliases) {
    if (a.norm && nm.includes(a.norm)) {
      return { basket: a.basket, label: a.label, title: middle.replace(new RegExp(a.label, 'i'), '').trim() };
    }
  }
  return { basket: null, label: null, title: middle.trim() };
}

// How many raw chars of `text` (from the end) correspond to normalised `norm`.
function trimmedTailLength(text, norm) {
  let count = 0, matched = 0;
  for (let i = text.length - 1; i >= 0 && matched < norm.length; i--) {
    count++;
    if (/[a-z0-9]/i.test(text[i])) matched++;
  }
  return count;
}
function trimmedHeadLength(text, norm) {
  let count = 0, matched = 0;
  for (let i = 0; i < text.length && matched < norm.length; i++) {
    count++;
    if (/[a-z0-9]/i.test(text[i])) matched++;
  }
  return count;
}

function parseMeta(text) {
  const meta = {};
  const sgpa = text.match(/S\.?G\.?P\.?A\.?\s*[:\-]?\s*(\d{1,2}\.\d{1,2})/i);
  if (sgpa) meta.sgpa = Number(sgpa[1]);
  const sem = text.match(/Semester\s*[:\-]?\s*(\d{1,2})/i);
  if (sem) meta.semester = Number(sem[1]);
  const reg = text.match(/Reg(?:d|istration)?\.?\s*(?:No\.?|Number|#)?\s*[:\-]?\s*(\d[A-Z0-9]{6,})/i);
  if (reg) meta.registrationNo = reg[1];
  const ay = text.match(/(20\d{2}\s*[-–]\s*20?\d{2})/);
  if (ay) meta.academicYear = ay[1].replace(/\s/g, '');
  return meta;
}

/**
 * parseGradesheetText(text, baskets) -> { meta, lines, unmapped, warning, rawTextSnippet }
 */
export function parseGradesheetText(text, baskets = []) {
  const aliases = aliasIndex(baskets);
  const rawLines = text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const lines = [];
  let unmapped = 0;

  for (const raw of rawLines) {
    if (/course\s*code/i.test(raw) && /grade/i.test(raw)) continue; // header row
    const codeM = raw.match(COURSE_CODE_RE);
    if (!codeM) continue;
    const rest = raw.slice(codeM[1].length).trim();
    const tailM = rest.match(TAIL_RE);
    if (!tailM) continue; // not a scorable course row
    const credit = Number(tailM[1]);
    const grade = tailM[2].toUpperCase();
    const middle = rest.slice(0, rest.length - tailM[0].length).trim();

    const { basket, label, title } = matchBasket(middle, aliases);
    if (!basket) unmapped++;

    lines.push({
      courseCode: codeM[1].toUpperCase(),
      courseTitle: (title || middle || '').trim(),
      credit: Number.isFinite(credit) ? credit : 0,
      grade,
      passed: PASSING.has(grade),
      basketId: basket ? basket._id : null,
      basketName: basket ? basket.name : label || null,
    });
  }

  let warning = null;
  if (!lines.length) warning = 'No course rows could be read from this PDF. It may be a scanned image — a text-based PDF is required.';
  else if (unmapped) warning = `${unmapped} course(s) could not be matched to a basket automatically and need manual mapping.`;

  return {
    meta: parseMeta(text),
    lines,
    unmapped,
    warning,
    rawTextSnippet: text.slice(0, 600),
  };
}

/** parseGradesheet(buffer, baskets) — async, extracts text then parses. */
export async function parseGradesheet(buffer, baskets = []) {
  const text = await extractText(buffer);
  return parseGradesheetText(text, baskets);
}

export { PASSING };
