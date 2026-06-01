-- Dedupe BNI 121 contact list.
--
-- 10 name-based duplicate groups exist (verified 2026-04-30 via /rest/v1).
-- For each group we keep ONE canonical record (the most complete / most
-- recent / status='Met') and mark the rest hidden=true so they fall out
-- of every page that respects the hidden flag (zoom-completed, tracker,
-- pipeline, etc.). Reversible — set hidden=false to bring any back.
--
-- Run AFTER migrations_apply.sql in the Supabase SQL editor.

-- ── 1. Reshma Dave: keep c68 (Thyrocare, Met, has phone). ────────────────────
update bni_contacts set hidden=false where id='c68';
update bni_contacts set hidden=true  where id in ('c23','c33');

-- ── 2. Prakruti Verma: keep c66 (IVF & Multi-Spec, Met, has phone). ─────────
--    NOTE: c66 was inadvertently hidden earlier — restore visibility here.
update bni_contacts set hidden=false where id='c66';
update bni_contacts set hidden=true  where id in ('c22','c67');

-- ── 3. Mr. Vaidhyanathan EKS: keep c71. ─────────────────────────────────────
update bni_contacts set hidden=false where id='c71';
update bni_contacts set hidden=true  where id='c72';

-- ── 4. Madhav Sehgal: keep c47 (Met, has phone). ────────────────────────────
update bni_contacts set hidden=false where id='c47';
update bni_contacts set hidden=true  where id='c76';

-- ── 5. Yogesh Waghmare: keep cwa02 (Met, latest). ───────────────────────────
update bni_contacts set hidden=false where id='cwa02';
update bni_contacts set hidden=true  where id in ('c62','c77');

-- ── 6. Chetan Dixit: keep cwa03 (Met, latest). ──────────────────────────────
update bni_contacts set hidden=false where id='cwa03';
update bni_contacts set hidden=true  where id='c73';

-- ── 7. Sagar Khimsaria: keep cwa07 (Met, latest). ───────────────────────────
update bni_contacts set hidden=false where id='cwa07';
update bni_contacts set hidden=true  where id='c86';

-- ── 8. Ahmad Khawar: keep cwa08 (Met, "Accline Corporate Services Ltd"). ────
update bni_contacts set hidden=false where id='cwa08';
update bni_contacts set hidden=true  where id='c87';

-- ── 9. Shivam Bajaj: keep cwa01 (Met, has company). ─────────────────────────
update bni_contacts set hidden=false where id='cwa01';
update bni_contacts set hidden=true  where id='c1777357927497';

-- ── 10. Baskaran Balasubramaniam: keep cwa04 (Met). ─────────────────────────
update bni_contacts set hidden=false where id='cwa04';
update bni_contacts set hidden=true  where id='c46';

-- ── 11. Lokesh Koshti: keep cwa17 (Met). Same phone. ────────────────────────
update bni_contacts set hidden=false where id='cwa17';
update bni_contacts set hidden=true  where id='c81';

-- ── 12. Homyar Dotiwala: keep cwa05 (Met). Same phone. ──────────────────────
update bni_contacts set hidden=false where id='cwa05';
update bni_contacts set hidden=true  where id='c1777357927498';

-- ── 13. Viswanathan Vishnu Vijay: keep cwa14 (Met). Same phone. ─────────────
update bni_contacts set hidden=false where id='cwa14';
update bni_contacts set hidden=true  where id='c79';

-- ── 14. Angelique Marais: keep c74. Same phone. ─────────────────────────────
update bni_contacts set hidden=false where id='c74';
update bni_contacts set hidden=true  where id='c75';

-- ── 15. Gautam Goswami: keep c70 (Met). Hide c44 (Identified, blank). ───────
update bni_contacts set hidden=false where id='c70';
update bni_contacts set hidden=true  where id='c44';

-- ── 16. Vijaymahantmesh Pujari: keep c1777357927501 (has phone). ────────────
update bni_contacts set hidden=false where id='c1777357927501';
update bni_contacts set hidden=true  where id='c57';

-- Verify: all currently-Met contacts that are still visible
-- (run this after the updates and you should see ~33 distinct people).
-- select id, first, last, status from bni_contacts
-- where status in ('Met','Follow-up','Converted') and hidden = false
-- order by last, first;
