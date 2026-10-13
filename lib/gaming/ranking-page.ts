import {
  parse,
  parseFragment,
  serialize,
  type DefaultTreeAdapterTypes,
} from 'parse5';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server.edge';
import {
  RankingPodiumPlayers,
  RankingTableRows,
} from '../../components/gaming/ranking-content.ts';
import type { Leaderboard } from './client';
import { INITIAL_RANKING_SLOT } from './initial-ranking.ts';

export function seedRankingPayload(
  source: string,
  ranking: Leaderboard | null,
): string {
  // Flight escapes strings starting with '$'; script payloads also escape '<' below.
  const data = JSON.stringify(ranking, (_, value) =>
    typeof value === 'string' && value.startsWith('$') ? '$' + value : value,
  );
  return source.replaceAll(JSON.stringify(INITIAL_RANKING_SLOT), () => data);
}

export function seedRankingHtml(
  source: string,
  ranking: Leaderboard | null,
): string {
  const document = parse(source);
  const visit = (node: DefaultTreeAdapterTypes.Node) => {
    if ('tagName' in node) {
      const marker = node.attrs.find(
        (attr) => attr.name === 'data-lif-ranking',
      )?.value;
      if (ranking && (marker === 'rows' || marker === 'podium')) {
        const component =
          marker === 'rows' ? RankingTableRows : RankingPodiumPlayers;
        const markup = renderToString(createElement(component, { ranking }));
        node.childNodes = parseFragment(node, markup, {}).childNodes;
        for (const child of node.childNodes) child.parentNode = node;
      }
      if (node.attrs.some((attr) => attr.name === 'data-lif-ranking-state')) {
        const busy = node.attrs.find((attr) => attr.name === 'aria-busy');
        if (busy) busy.value = String(ranking === null);
      }
      if (node.tagName === 'script') {
        for (const child of node.childNodes) {
          if (
            !('value' in child) ||
            !child.value.includes(INITIAL_RANKING_SLOT)
          )
            continue;
          const start = child.value.indexOf('.rsc.push(') + '.rsc.push('.length;
          const end = child.value.lastIndexOf(')');
          if (start < '.rsc.push('.length || end <= start)
            throw new Error('RANKING_TEMPLATE_INVALID');
          const payload = JSON.parse(child.value.slice(start, end));
          if (typeof payload !== 'string')
            throw new Error('RANKING_TEMPLATE_INVALID');
          const updated = JSON.stringify(
            seedRankingPayload(payload, ranking),
          ).replaceAll('<', '\\u003c');
          child.value =
            child.value.slice(0, start) + updated + child.value.slice(end);
        }
      }
    }
    if ('childNodes' in node) for (const child of node.childNodes) visit(child);
  };
  visit(document);
  return serialize(document);
}

export function rankingPageResponse(
  source: string,
  kind: 'html' | 'rsc',
  ranking: Leaderboard | null,
  head = false,
) {
  return new Response(
    head
      ? null
      : kind === 'html'
        ? seedRankingHtml(source, ranking)
        : seedRankingPayload(source, ranking),
    {
      headers: {
        'Content-Type':
          kind === 'html'
            ? 'text/html; charset=utf-8'
            : 'text/x-component; charset=utf-8',
        'Cache-Control': 'no-store',
        'Netlify-CDN-Cache-Control': 'no-store',
      },
    },
  );
}
