import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';
import ChordSheetJS from 'chordsheetjs';

const parser = new ChordSheetJS.ChordProParser();

/**
 * Transliterates Russian characters to English for clean URL slugs.
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

/**
 * Custom formatter that generates semantic, styleable HTML.
 * Includes data attributes for client-side transposition.
 */
function renderSongToHtml(song) {
  let html = '<div class="song-body">';
  
  song.paragraphs.forEach(paragraph => {
    html += '<div class="song-paragraph">';
    
    paragraph.lines.forEach(line => {
      if (line.type === 'comment') {
        html += `<div class="song-comment">${line.value}</div>`;
        return;
      }
      
      const lineClass = line.type === 'tab' ? 'song-line tab-line' : 'song-line';
      html += `<div class="${lineClass}">`;
      
      line.items.forEach(item => {
        // ChordLyricsPair
        const hasChord = !!item.chord;
        const hasLyrics = !!item.lyrics;
        
        if (hasChord || hasLyrics) {
          html += '<span class="chord-lyrics-pair">';
          if (hasChord) {
            const chordStr = String(item.chord).trim();
            html += `<span class="chord" data-original-chord="${chordStr}">${chordStr}</span>`;
          }
          if (hasLyrics) {
            html += `<span class="lyrics">${item.lyrics}</span>`;
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
  
  html += '</div>';
  return html;
}

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
      songData = parser.parse(rawContent);
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

    // Create slugs
    const artistSlug = slugify(artist);
    const songSlug = slugify(title);

    // Format AST to our custom styleable HTML
    const html = renderSongToHtml(songData);

    return {
      title,
      artist,
      key,
      tempo,
      artistSlug,
      songSlug,
      rawContent,
      html,
      filePath
    };
  });
}
