import { loadEnv, type Plugin } from 'vite';
import { CompetitionStore, competitionMiddleware } from './server.ts';
import { CompetitionSheets } from './sheets.ts';
import { createLocalDatabaseApi } from './local-database.ts';
import { localApiBridge } from './local-api-bridge.ts';
export function localGamesApi(): Plugin {
  return {
    name: 'lif-local-games-api',
    apply: 'serve',
    configureServer(server) {
      const env = {
        ...loadEnv(server.config.mode, server.config.root, ''),
        ...process.env,
      };
      const mode = env.LIF_GAME_STORAGE ?? 'sheets';
      if (!['sheets', 'sqlite', 'postgres'].includes(mode))
        throw new Error('LIF local games: invalid storage configuration');
      if (mode === 'postgres') {
        const service = createLocalDatabaseApi(env);
        server.middlewares.use(
          localApiBridge((request) => service.request(request)),
        );
        server.httpServer?.once('close', () => {
          void service
            .close()
            .catch(() => console.error('LIF_LOCAL_DATABASE_CLOSE_FAILED'));
        });
        return;
      }
      const store = new CompetitionStore(
        env.LIF_GAMES_DB_PATH || 'work/gaming/competition.sqlite',
      );
      const endpoint = env.LIF_SHEETS_ENDPOINT;
      const secret = env.LIF_SHEETS_SYNC_KEY;
      if (mode === 'sheets' && !!endpoint !== !!secret)
        throw new Error('LIF Sheets: missing private configuration');
      const sheets =
        mode === 'sheets' && endpoint && secret
          ? new CompetitionSheets(store, endpoint, secret)
          : undefined;
      server.middlewares.use(
        competitionMiddleware(store, sheets, {
          referenceRanking: true,
          localTesting: env.LIF_LOCAL_GAME_TESTING !== '0',
        }),
      );
      const retry = sheets
        ? setInterval(() => {
            void sheets.flush().catch(() => {});
          }, 30000)
        : undefined;
      server.httpServer?.once('close', () => {
        if (retry) clearInterval(retry);
        store.db.close();
      });
    },
  };
}
