import { Page } from 'playwright';

export async function getRenderedDOM(page: Page): Promise<string> {
  // Get the serialized HTML after JavaScript execution
  const domContent = await page.evaluate(() => {
    // Clone the document to avoid modifying the original
    const clone = document.documentElement; //.cloneNode(true) as HTMLElement;

    // for each element, get computed styles to determine visibility, and remove if not visible
    const elements = clone.querySelectorAll('*');

    const elementsToRemove: Element[] = [];
    elements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);
      const isVisible =
        computedStyle.display !== 'none' &&
        computedStyle.visibility !== 'hidden' &&
        computedStyle.opacity !== '0';

      if (!isVisible) {
        elementsToRemove.push(element);
      }
    });

    // Optional: Remove other non-visual elements
    const nonVisualTags = clone.querySelectorAll(
      'noscript, iframe, link[rel="stylesheet"], meta, svg, img, symbol, path, style, script',
    );
    nonVisualTags.forEach((element) => elementsToRemove.push(element));

    elementsToRemove.forEach((element) => element.remove());

    console.log(
      'removing ',
      elementsToRemove.length,
      ' elements out of a total ',
      elements.length,
    );

    return clone.outerHTML;
  });

  // remove all newlines using a regex, and also collapse multiple spaces into one
  return domContent.replace(/\n/g, '').replace(/\s+/g, ' ');
}
