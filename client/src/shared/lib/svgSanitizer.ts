export function sanitizeSvgMarkup(rawSvg: string): string {
  if (typeof DOMParser === 'undefined') {
    return '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
  const parserError = doc.querySelector('parsererror');
  if (
    parserError ||
    !doc.documentElement ||
    doc.documentElement.tagName.toLowerCase() !== 'svg'
  ) {
    return '';
  }

  const dangerousSelectors = 'script, iframe, object, embed, link, meta';
  for (const el of doc.querySelectorAll(dangerousSelectors)) {
    el.remove();
  }

  for (const fo of doc.querySelectorAll('foreignObject')) {
    for (const nested of fo.querySelectorAll('script, iframe, object, embed')) {
      nested.remove();
    }
  }

  for (const el of doc.querySelectorAll('*')) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim().toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (
        (name === 'href' || name === 'xlink:href' || name === 'src') &&
        (val.startsWith('javascript:') ||
          val.startsWith('vbscript:') ||
          val.startsWith('data:text/html'))
      ) {
        el.removeAttribute(attr.name);
      }
    }
  }

  return new XMLSerializer().serializeToString(doc.documentElement);
}
