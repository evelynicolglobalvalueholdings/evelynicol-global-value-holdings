# EVELYNICOL GLOBAL VALUE HOLDINGS S.A.

Site public și centru de administrare conectate la Supabase.

## Cloudflare Pages
Aplicație statică, fără build obligatoriu. Fișierele publice sunt în rădăcina repository-ului.

## Securitate
Frontend-ul folosește exclusiv cheia Supabase publishable. Drepturile de administrare sunt validate în baza de date prin RLS. Nu adăuga niciodată service_role, secret keys, parole sau coduri 2FA în repository.
