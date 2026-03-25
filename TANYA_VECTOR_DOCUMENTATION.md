# Dokumentasi: Tanya (pgvector + Laravel AI SDK)

Dokumen ini menjelaskan bagaimana modul **`Tanya`** bekerja memanfaatkan **vector embedding** dari data sistem (PostgreSQL + pgvector), sampai menghasilkan jawaban yang relevan.

---

## 1. Tujuan fitur `Tanya`

Modul `Tanya` memungkinkan user mengajukan pertanyaan apa saja, lalu sistem:

1. Mencari dokumen/rekaman data yang relevan dari database memakai kemiripan vector (**pgvector**).
2. Menyusun konteks terkait (cuplikan `title` + `content`) ke prompt.
3. Memanggil AI agent untuk merangkai jawaban dalam Bahasa Indonesia.

Intinya: **pertanyaan dijawab berdasarkan “pengetahuan” yang tersimpan dalam bentuk vector**.

---

## 2. Apakah migration perlu kolom `vector`?

**Ya, jika Anda ingin pencarian kemiripan berbasis vector (pgvector).**

Tanpa kolom `vector`, sistem tidak bisa menghitung similarity lewat `whereVectorSimilarTo`.

Pada implementasi ini, kita membuat tabel:

- `knowledge_items`

dengan kolom:

- `embedding` (tipe `vector`) untuk menyimpan embedding.

Jika database bukan PostgreSQL, implementasi ini tetap aman:

- `embedding` disimpan sebagai `json` (walaupun tool vector tidak aktif).

---

## 3. Setup Laravel AI SDK

Langkah awal (yang sudah dilakukan di project ini):

1. Install package:

```bash
composer require laravel/ai
```

2. Publish konfigurasi dan migrasi AI:

```bash
php artisan vendor:publish --provider="Laravel\\Ai\\AiServiceProvider"
```

3. Update provider dan API key di `config/ai.php` (mengikuti `.env`):

- `OPENAI_API_KEY` (atau provider lain seperti Ollama jika digunakan)

Dokumen resmi: [Laravel AI SDK](https://laravel.com/docs/13.x/ai-sdk)

---

## 4. Migration vector: `knowledge_items`

File migrasi yang dipakai:

- `database/migrations/2026_03_25_120000_create_knowledge_items_table.php`

Untuk PostgreSQL/pgvector:

1. `Schema::ensureVectorExtensionExists();` memastikan ekstensi pgvector ada.
2. Kolom vector dibuat:

```php
$table->vector('embedding', dimensions: 1536)->nullable();
```

3. index vector dibuat agar pencarian similarity cepat:

```php
$table->vectorIndex('embedding');
```

---

## 5. Mengapa embedding tetap butuh API token?

Walaupun Laravel menyediakan function:

- `Str::of($text)->toEmbeddings(...)`

function tersebut **bukan “vector bawaan”**.

Yang terjadi secara internal:

1. Laravel AI SDK membuat request ke **AI provider** untuk menghasilkan embedding.
2. Embedding yang dikembalikan provider ditulis ke kolom `knowledge_items.embedding`.

Jadi, embedding selalu butuh:

- API key (mis. `OPENAI_API_KEY`) atau
- akses provider yang tersedia (mis. Ollama).

Jika provider gagal (rate limit/401/403), embedding bisa tetap `NULL`, sehingga similarity vector tidak bekerja optimal.

Pada project ini ada fallback (lihat bagian 9) agar user tetap dapat jawaban.

---

## 6. Model & observer: pengisian `knowledge_items.embedding`

Komponen yang terlibat:

- Model: `app/Models/KnowledgeItem.php`
- Observer: `app/Observers/KnowledgeItemObserver.php`

Observer bekerja saat baris `knowledge_items` dibuat/di-update.

Logika penting:

1. Observer membentuk teks gabungan dari `title` + `content`.
2. Jika `embedding` masih `NULL` / kosong, observer mencoba generate embeddings lewat `toEmbeddings`.
3. Dimensi dibuat sesuai migration (1536).

Dengan begitu, ketika `knowledge_items` terisi dokumen baru, embedding juga otomatis di-generate.

---

## 7. “Sync” dokumen dari data sistem (real database)

Supaya `Tanya` bisa menjawab berdasarkan data Anda, project ini melakukan:

1. `CategoryObserver`:
   - saat kategori dibuat/diedit/hapus, buat/update dokumen `knowledge_items` dengan pola:
     - `title = category:{id}`
2. `ProductObserver`:
   - saat produk dibuat/diedit/hapus, buat/update dokumen `knowledge_items` dengan pola:
     - `title = product:{id}`
3. `PosController@store`:
   - setelah stok dikurangi, konten dokumen product di-sync lagi agar “stok terbaru” bisa masuk konteks.

Selain itu, ada seeder `KnowledgeItemSeeder` dan command `ai:vectorize-db` untuk ingest massal.

---

## 8. Pencarian kemiripan vector (pgvector)

Pada `TanyaController@ask`, server melakukan pencarian dokumen relevan menggunakan:

- `whereVectorSimilarTo('embedding', $message, minSimilarity: ...)`

Hasil query (match) kemudian disusun menjadi blok:

- `DATA TERKAIT (hasil pencarian vector): ...`

blok ini disisipkan ke prompt sebelum memanggil agent.

Dengan desain ini, jawaban AI bisa “nyantol” ke isi sistem.

---

## 9. Fallback jika vector tidak tersedia

Jika embedding masih `NULL` (mis. provider embedding gagal), maka:

1. `TanyaController` mencoba fallback dengan pencarian string biasa menggunakan `ILIKE` ke `title`/`content`.
2. Selain itu, respon UI tetap bisa tampil meskipun pencarian vector tidak maksimal.

Ini mencegah fitur `Tanya` menjadi “blank” saat embedding belum siap.

---

## 10. Cara debugging cepat

1. Cek apakah embedding terisi:

```sql
select count(*) as total, count(embedding) as embedding_not_null
from knowledge_items;
```

2. Jika `embedding_not_null = 0`:
   - pastikan `.env` sudah punya `OPENAI_API_KEY` (atau provider lain)
   - cek `storage/logs/laravel.log` untuk error 401/403/rate-limit

---

## 11. Cara ingest massal semua tabel (sesuai permintaan Anda)

Project ini menyediakan command:

```bash
php artisan ai:vectorize-db
```

Command ini membentuk dokumen untuk baris-baris dari tabel database menjadi `knowledge_items`.

Catatan:

- Proses massal bisa memakan biaya dan mudah terkena rate limit provider embedding.
- Karena itu command menyediakan opsi:
  - `--max-rows-per-table`
  - `--force`
  - `--exclude-tables`

---

## 12. Implementasi yang bisa Anda kembangkan

Untuk meningkatkan kualitas, Anda bisa menambahkan:

- chunking konten besar (mis. tabel panjang) agar embedding lebih akurat
- pengaturan minSimilarity dan limit pencarian
- strategi caching embeddings untuk mengurangi biaya
- “whitelist tabel” agar yang vectorize hanya tabel penting

