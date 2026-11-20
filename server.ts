import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  bulkImportUserData,
  deleteCustomDhikr,
  getOrCreateUser,
  getUserSnapshot,
  upsertCustomDhikr,
  upsertDailyRecord,
  upsertUserSettings,
  upsertUserTarget,
} from './src/db/repository.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Sağlık kontrolü
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Kullanıcı verilerinin tamamını getir (oturum açmış kullanıcı için)
  app.get('/api/state', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@tanesi.local`;
      const name = typeof req.user!.name === 'string' ? req.user!.name : '';
      const user = await getOrCreateUser(uid, email, name);
      const snapshot = await getUserSnapshot(user.id);
      res.json({ user: { id: user.id, email: user.email, displayName: user.displayName }, ...snapshot });
    } catch (error) {
      console.error('GET /api/state failed:', error);
      res.status(500).json({ error: 'Veriler yüklenirken bir hata oluştu.' });
    }
  });

  // Tekil günlük zikir kaydı güncelle
  app.put('/api/records', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { dhikrSlug, recordDate, count, targetSnapshot } = req.body ?? {};
      if (
        typeof dhikrSlug !== 'string' ||
        typeof recordDate !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(recordDate) ||
        typeof count !== 'number'
      ) {
        return res.status(400).json({ error: 'Geçersiz kayıt verisi.' });
      }
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || `${req.user!.uid}@tanesi.local`,
        typeof req.user!.name === 'string' ? req.user!.name : ''
      );
      const record = await upsertDailyRecord(
        user.id,
        dhikrSlug,
        recordDate,
        count,
        typeof targetSnapshot === 'number' ? targetSnapshot : 100
      );
      res.json({ record });
    } catch (error) {
      console.error('PUT /api/records failed:', error);
      res.status(500).json({ error: 'Zikir kaydı sunucuya kaydedilemedi.' });
    }
  });

  // Zikir hedefi güncelle
  app.put('/api/targets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { dhikrSlug, targetCount } = req.body ?? {};
      if (typeof dhikrSlug !== 'string' || typeof targetCount !== 'number' || targetCount < 1) {
        return res.status(400).json({ error: 'Geçersiz hedef verisi.' });
      }
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || `${req.user!.uid}@tanesi.local`,
        typeof req.user!.name === 'string' ? req.user!.name : ''
      );
      const target = await upsertUserTarget(user.id, dhikrSlug, targetCount);
      res.json({ target });
    } catch (error) {
      console.error('PUT /api/targets failed:', error);
      res.status(500).json({ error: 'Hedef kaydedilemedi.' });
    }
  });

  // Kullanıcı ayarlarını güncelle
  app.put('/api/settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body ?? {};
      const fontSize =
        body.fontSize === 'small' || body.fontSize === 'large' ? body.fontSize : 'medium';
      const theme = body.theme === 'dark' ? 'dark' : 'light';
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || `${req.user!.uid}@tanesi.local`,
        typeof req.user!.name === 'string' ? req.user!.name : ''
      );
      const settings = await upsertUserSettings(user.id, {
        soundEnabled: Boolean(body.soundEnabled),
        vibrationEnabled: Boolean(body.vibrationEnabled),
        fontSize,
        theme,
        dayStartHour: typeof body.dayStartHour === 'number' ? body.dayStartHour : 0,
        remindersJson:
          typeof body.remindersJson === 'string'
            ? body.remindersJson
            : JSON.stringify(body.reminders ?? []),
      });
      res.json({ settings });
    } catch (error) {
      console.error('PUT /api/settings failed:', error);
      res.status(500).json({ error: 'Ayarlar kaydedilemedi.' });
    }
  });

  // Kullanıcının kendi tesbihini oluştur / güncelle
  app.post('/api/custom-dhikrs', requireAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body ?? {};
      if (
        typeof body.slug !== 'string' ||
        !body.slug.startsWith('custom-') ||
        typeof body.title !== 'string' ||
        !body.title.trim()
      ) {
        return res.status(400).json({ error: 'Geçersiz tesbih bilgisi.' });
      }
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || `${req.user!.uid}@tanesi.local`,
        typeof req.user!.name === 'string' ? req.user!.name : ''
      );
      const customDhikr = await upsertCustomDhikr(user.id, {
        slug: body.slug,
        title: body.title,
        arabic: typeof body.arabic === 'string' ? body.arabic : '',
        transliteration:
          typeof body.transliteration === 'string' ? body.transliteration : '',
        meaning: typeof body.meaning === 'string' ? body.meaning : '',
        note: typeof body.note === 'string' ? body.note : '',
        defaultTarget:
          typeof body.defaultTarget === 'number' && body.defaultTarget >= 1
            ? body.defaultTarget
            : 100,
      });
      res.json({ customDhikr });
    } catch (error) {
      console.error('POST /api/custom-dhikrs failed:', error);
      res.status(500).json({ error: 'Özel tesbih kaydedilemedi.' });
    }
  });

  // Kullanıcının kendi tesbihini sil
  app.delete('/api/custom-dhikrs/:slug', requireAuth, async (req: AuthRequest, res) => {
    try {
      const slug = req.params.slug;
      if (!slug || !slug.startsWith('custom-')) {
        return res.status(400).json({ error: 'Geçersiz tesbih kimliği.' });
      }
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || `${req.user!.uid}@tanesi.local`,
        typeof req.user!.name === 'string' ? req.user!.name : ''
      );
      await deleteCustomDhikr(user.id, slug);
      res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /api/custom-dhikrs failed:', error);
      res.status(500).json({ error: 'Özel tesbih silinemedi.' });
    }
  });

  // Toplu senkronizasyon / yedek geri yükleme
  app.post('/api/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { targets, records, settings, customDhikrs } = req.body ?? {};
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || `${req.user!.uid}@tanesi.local`,
        typeof req.user!.name === 'string' ? req.user!.name : ''
      );
      const snapshot = await bulkImportUserData(user.id, {
        targets: targets && typeof targets === 'object' ? targets : {},
        records: records && typeof records === 'object' ? records : {},
        customDhikrs: Array.isArray(customDhikrs) ? customDhikrs : [],
        settings: {
          soundEnabled: Boolean(settings?.soundEnabled ?? true),
          vibrationEnabled: Boolean(settings?.vibrationEnabled ?? true),
          fontSize:
            settings?.fontSize === 'small' || settings?.fontSize === 'large'
              ? settings.fontSize
              : 'medium',
          theme: settings?.theme === 'dark' ? 'dark' : 'light',
          dayStartHour: typeof settings?.dayStartHour === 'number' ? settings.dayStartHour : 0,
          remindersJson: JSON.stringify(settings?.reminders ?? []),
        },
      });
      res.json(snapshot);
    } catch (error) {
      console.error('POST /api/sync failed:', error);
      res.status(500).json({ error: 'Veriler senkronize edilemedi.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tanesi server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
