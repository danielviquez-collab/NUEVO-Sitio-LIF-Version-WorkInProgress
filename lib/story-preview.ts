// Keep an exact prefix of the original paragraphs and only cut at word boundaries.
export function fitStoryPreview(paragraphs: readonly string[], fits: (text: string[]) => boolean): string[] {
  if (fits([...paragraphs])) return [...paragraphs];
  const words = paragraphs.map(paragraph => [...paragraph.matchAll(/\S+/g)]);
  const total = words.reduce((sum, paragraph) => sum + paragraph.length, 0);
  function prefix(count: number) {
    const result: string[] = [];
    let partial = false;
    for (let index = 0; index < paragraphs.length && count > 0; index++) {
      const taken = Math.min(count, words[index].length);
      if (!taken) continue;
      const word = words[index][taken - 1];
      result.push(paragraphs[index].slice(0, word.index! + word[0].length));
      partial = taken < words[index].length;
      count -= taken;
    }
    if (partial) result[result.length - 1] = result.at(-1)!.replace(/…$/, '') + '…';
    return result;
  }
  let low = 0;
  let high = total;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (fits(prefix(middle))) low = middle;
    else high = middle - 1;
  }
  return prefix(low);
}
