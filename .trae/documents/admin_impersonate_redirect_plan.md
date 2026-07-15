# Plán úpravy presmerovania pre admin impersonate

## Repozitár research
- Našiel som súbor `app/api/admin/impersonate/route.ts`
- V riadkoch 18-24 je volanie `supabase.auth.admin.generateLink`
- Aktuálna hodnota `redirectTo` je: `"https://app.ticketclub.vip/auth/callback?next=/nakupy"`

## Súbory na úpravu
- `app/api/admin/impersonate/route.ts`

## Krok implementácie
1. Upraviť riadok 22, zmeniť `redirectTo` na `"https://app.ticketclub.vip/nakupy"`

## Potenciálne závislosti
- Žiadne ďalšie závislosti, iba jednoduchá zmena textu

## Ošetrenie rizík
- Žiadne rizíka, je to jednoduchá zmena presmerovania
