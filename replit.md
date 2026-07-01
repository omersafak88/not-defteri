# Not Defteri

Kişisel not ve günlük uygulaması — not veya kısa günlük girişi yapılabilir, etiketlerle sınıflandırılabilir, fotoğraf eklenebilir ve zaman çizelgesinde görüntülenebilir.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API sunucusunu çalıştır (port 5000)
- `pnpm run typecheck` — tüm paketlerde tip kontrolü
- `pnpm run build` — typecheck + tüm paketleri derle
- Mobile: `artifacts/mobile: expo` iş akışı ile çalışır

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobil: Expo (React Native) + Expo Router
- Depolama: AsyncStorage (tüm veriler cihazda)
- API: Express 5 (arka uç, şimdilik sağlık kontrolü)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mobile/` — Expo mobil uygulama
- `artifacts/mobile/context/NotesContext.tsx` — tüm durum yönetimi ve AsyncStorage
- `artifacts/mobile/app/(tabs)/` — 3 ana sekme (Notlar, Zaman Çizelgesi, Ayarlar)
- `artifacts/mobile/app/entry/` — yeni giriş ve detay ekranları
- `artifacts/mobile/constants/colors.ts` — tema renkleri

## Architecture decisions

- Tüm veriler AsyncStorage'da saklanır; dış servis yok
- JSON dışa aktarma: React Native'in `Share` API'si ile metin olarak paylaşılır
- HTML dışa aktarma: Biçimlendirilmiş HTML belgesi olarak paylaşılır
- Fotoğraflar cihaz URI'si olarak saklanır (taşınabilir değil, ancak JSON'da referans tutulur)
- Etiketler tüm girişlerden dinamik olarak türetilir (ayrı depolama yok)

## Product

- **Not**: Genel amaçlı kısa notlar, etiketlerle sınıflandırma, fotoğraf ekleme
- **Günlük**: Tarih bağlantılı günlük girişleri, zaman çizelgesinde görüntüleme
- **Zaman Çizelgesi**: Günlük girişleri aya göre gruplandırılmış kronolojik sırada
- **Dışa Aktarma**: Yedekleme için JSON, belgeleme için HTML

## User preferences

_Populate as you build._

## Gotchas

- UUID için `uuid` paketi kullanma — `Date.now().toString() + Math.random().toString(36).substr(2, 9)` kullan
- `expo-sharing` kurulu değil — `Share` from 'react-native' kullanılıyor
- Mobile workflow adı: `artifacts/mobile: expo`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
