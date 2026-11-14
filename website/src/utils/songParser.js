import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';
import ChordSheetJS from 'chordsheetjs';

/**
 * Транслитерация кириллицы в латиницу для чистых URL-адресов.
 */
function transliterate(text) {
  const ru = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ы': 'Y', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text.split('').map(char => ru[char] || char).join('');
}

function slugify(text) {
  return transliterate(text)
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')        // Remove all non-word chars
    .replace(/--+/g, '-');          // Replace multiple - with single -
}

/* ------------------------------- секции песни ------------------------------ */

/** Подпись секции по умолчанию для директивы разметки. */
const SECTION_TITLES = {
  sov: 'Куплет',
  soc: 'Припев',
  sot: 'Вступление',
  bridge: 'Бридж',
  solo: 'Соло',
  coda: 'Кода'
};

const SECTION_START = /^(sov|soc|sot|bridge|solo|coda|comment)$/;
const SECTION_END = /^(eov|eoc|eot)$/;
const TAB_LINE = /^\s*(?:[A-G][b#]?(?:m|min)?\s*\|\s*)+[A-G][b#]?(?:m|min)?\s*$/;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Делит содержимое .cho на подписанные секции.
 * Метаданные ({title:}, {key:}, {meta: ...}) в текст не попадают,
 * а {sov} / {soc} / {sot} задают название секции.
 */
function splitSections(rawContent) {
  const sections = [];
  let current = { label: '', lines: [] };

  for (const line of rawContent.split(/\r?\n/)) {
    const directive = line.match(/^\s*\{([a-zA-Z_]+)\s*:?\s*([^}]*)\}\s*$/);
    if (directive) {
      const name = directive[1].toLowerCase();
      const value = (directive[2] || '').trim();

      if (SECTION_START.test(name)) {
        if (current.lines.some(item => item.trim()) || current.label) sections.push(current);
        current = { label: value || SECTION_TITLES[name] || 'Куплет', lines: [] };
        continue;
      }
      if (SECTION_END.test(name)) {
        if (current.lines.some(item => item.trim()) || current.label) sections.push(current);
        current = { label: '', lines: [] };
        continue;
      }
      continue; // служебная директива — метаданные
    }
    current.lines.push(line);
  }

  if (current.lines.some(item => item.trim()) || current.label) sections.push(current);
  return sections;
}

function itemText(item) {
  if (!item) return '';
  if (typeof item.lyrics === 'string') return item.lyrics;
  if (item.type === 'tab') {
    return Array.isArray(item.value) ? item.value.join(' | ') : String(item.value || '');
  }
  return '';
}

function lineText(line) {
  return (line.items || []).map(itemText).join('');
}

/**
 * Превращает разобранную секцию в семантическую HTML-разметку.
 * Класс .chord и атрибут data-original-chord — контракт с транспонером.
 */
function renderParagraphs(song) {
  let html = '';

  (song.paragraphs || []).forEach(paragraph => {
    const hasContent = paragraph.lines.some(line =>
      line.type === 'comment' || line.items.some(item => !!item.chord || !!item.lyrics || item.type === 'tab')
    );
    if (!hasContent) return;

    html += '<div class="song-paragraph">';

    paragraph.lines.forEach(line => {
      if (line.type === 'comment') {
        html += `<div class="song-comment">${escapeHtml(line.value)}</div>`;
        return;
      }

      const text = lineText(line);

      // Строки-табуляции (Am | Am | C | C) показываем моноширинной строкой.
      if (TAB_LINE.test(text)) {
        html += `<div class="song-line tab-line">${escapeHtml(text.trim())}</div>`;
        return;
      }

      html += '<div class="song-line">';

      line.items.forEach(item => {
        const hasChord = !!item.chord;
        const hasLyrics = !!item.lyrics;

        if (hasChord || hasLyrics) {
          html += '<span class="chord-lyrics-pair">';
          if (hasChord) {
            const chord = String(item.chord).trim();
            html += `<span class="chord" data-original-chord="${escapeHtml(chord)}">${escapeHtml(chord)}</span>`;
          }
          if (hasLyrics) {
            html += `<span class="lyrics">${escapeHtml(item.lyrics)}</span>`;
          } else if (hasChord) {
            html += '<span class="lyrics">&nbsp;</span>';
          }
          html += '</span>';
        }
      });

      html += '</div>';
    });

    html += '</div>';
  });

  return html;
}

/**
 * Собирает всю песню: секции с подписями + текст с аккордами.
 */
function renderSongToHtml(rawContent) {
  const sections = splitSections(rawContent);
  let html = '<div class="song-body">';

  // Повторяющиеся секции получают номер: «Куплет 1», «Куплет 2», «Куплет 3».
  const labelTotals = new Map();
  sections.forEach(section => {
    if (!section.label) return;
    labelTotals.set(section.label, (labelTotals.get(section.label) || 0) + 1);
  });
  const labelSeen = new Map();

  sections.forEach(section => {
    const body = section.lines.join('\n');
    if (!body.trim() && !section.label) return;

    let parsed = { paragraphs: [] };
    if (body.trim()) {
      try {
        parsed = new ChordSheetJS.ChordProParser().parse(body);
      } catch (error) {
        parsed = { paragraphs: [] };
      }
    }

    const content = renderParagraphs(parsed);
    if (!content && !section.label) return;

    html += '<section class="song-section">';
    if (section.label) {
      const seen = (labelSeen.get(section.label) || 0) + 1;
      labelSeen.set(section.label, seen);
      const title =
        (labelTotals.get(section.label) || 1) > 1 ? `${section.label} ${seen}` : section.label;
      html += `<h2 class="song-section-label">${escapeHtml(title)}</h2>`;
    }
    html += content;
    html += '</section>';
  });

  html += '</div>';
  return html;
}

/* --------------------------------- каталог --------------------------------- */

export function getAllSongs() {
  const rootDir = path.resolve('../');

  const files = glob.sync('**/*.cho', {
    cwd: rootDir,
    ignore: ['**/node_modules/**', 'website/**', '**/default.cho', '**/.git/**'],
    absolute: true
  });

  return files.map(filePath => {
    const rawContent = fs.readFileSync(filePath, 'utf-8');

    // Parse using ChordSheetJS
    let songData;
    try {
      songData = new ChordSheetJS.ChordProParser().parse(rawContent);
    } catch (e) {
      console.error(`Error parsing file ${filePath}:`, e);
      // Fallback simple parsing
      songData = {
        title: path.basename(filePath, '.cho'),
        artist: path.basename(path.dirname(filePath)),
        paragraphs: []
      };
    }

    // Extracted artist and title
    const artist = songData.artist || path.basename(path.dirname(filePath)) || 'Unknown Artist';
    const title = songData.title || path.basename(filePath, '.cho') || 'Untitled';
    const key = songData.key || '';
    const tempo = songData.tempo || '';

    // Extract video url if present (supports standard {meta: video ...}, {video: ...}, or {meta: youtube ...})
    const videoMatch = rawContent.match(/\{meta:\s*video\s+([^\}]+)\}/i) ||
                       rawContent.match(/\{video:\s*([^\}]+)\}/i) ||
                       rawContent.match(/\{meta:\s*youtube\s+([^\}]+)\}/i);
    const videoUrl = videoMatch ? videoMatch[1].trim() : '';

    // Extract capo if present (supports standard {capo: ...} or {meta: capo ...})
    const capoMatch = rawContent.match(/\{capo:\s*([^\}]+)\}/i) ||
                      rawContent.match(/\{meta:\s*capo\s+([^\}]+)\}/i);
    const capo = capoMatch ? capoMatch[1].trim() : '';

    // Create slugs
    const artistSlug = slugify(artist);
    const songSlug = slugify(title);

    // Format AST to our custom styleable HTML
    const html = renderSongToHtml(rawContent);

    return {
      title,
      artist,
      key,
      tempo,
      capo,
      videoUrl,
      artistSlug,
      songSlug,
      rawContent,
      html,
      filePath
    };
  });
}
