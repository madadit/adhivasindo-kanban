# CRUD Task Management Board — Frontend Take Home Test (Adhivasindo)

Aplikasi papan manajemen tugas (Kanban Board) berbasis **Ionic** yang dibangun untuk memenuhi kebutuhan *Take Home Test* posisi Frontend Engineer di **Adhivasindo**. Aplikasi ini mendukung pengelolaan tugas secara penuh di sisi klien (*client-side*).

---

## Fitur Utama

1. **Tampilan Board & Column**
   - Multi-column Kanban board (contoh: *To Do*, *Doing*, *Review*, *Done*, *Rework*, serta dukungan penambahan kolom/list).
   - Setiap kolom dapat menampung banyak *task card*.

2. **Task Card & Detail View**
   - Informasi tugas meliputi: Judul task, Deskripsi, Assignee (avatar/anggota tim), Due Date, Label (*Feature*, *Bug*, *Issue*, *Undefined*), Priority, Checklist (*subtask*), dan Attachments.
   - Modal / halaman detail task untuk melihat dan mengubah informasi tugas secara lengkap.

3. **Filtering & Searching Task**
   - Pencarian task berdasarkan kata kunci.
   - Penyaringan (*filtering*) task berdasarkan *assignee*, *label*, atau *due date*.

4. **CRUD Task**
   - **Create:** Menambahkan task baru ke kolom tertentu.
   - **Read:** Menampilkan task dalam bentuk card dengan ringkasan informasi dan *progress bar*.
   - **Update:** Mengubah data task melalui form modal atau tampilan detail.
   - **Delete:** Menghapus task dari kolom.

5. **Drag and Drop**
   - Memindahkan task antar kolom menggunakan interaksi *drag and drop* di sisi frontend.

6. **Checklist (Subtask) & Progress**
   - Menambahkan item *subtask* baru pada sebuah task.
   - Menandai selesai/belum selesai (*check/uncheck*) dengan pembaruan *progress bar* secara otomatis.

7. **Penyimpanan Data Lokal**
   - Persisting data di sisi klien menggunakan `Local Storage`

8. **Fitur Tambahan (Opsional)**
   - Cover image pada task card.
   - Notifikasi *toast* saat melakukan aksi tambah, ubah, atau hapus task.
   - Animasi dan transisi interaksi antarmuka.

---

## Tech Stack


- **Framework UI:** Ionic Framework (`@ionic/react`)
- **Frontend Framework:** React
- **Bahasa:** TypeScript
- **Styling:** Ionic Utilities
- **Penyimpanan Lokal:** Local Storage & State Management

---

## Cara Menjalankan Proyek

### Prasyarat
Pastikan kamu sudah menginstal:
- [Node.js](https://nodejs.org/) (disarankan versi LTS)
- npm / yarn / pnpm
- Ionic CLI (opsional, jika menggunakan perintah `ionic`)

### Instalasi & Menjalankan Server Lokal
1. *Clone* repository ini:
   ```bash
   git clone https://github.com/madadit/adhivasindo-kanban.git
   cd <nama-folder-proyek>
   ```

2. Instal seluruh *dependencies*:
   ```bash
   npm install
   ```

3. Jalankan aplikasi dalam mode pengembangan:
   ```bash
   npm start
   # atau
   ionic serve
   ```

4. Buka browser dan akses alamat yang tampil di terminal `http://localhost:8100.

---

## Struktur Folder

```text
src/
├── components/       # Komponen board, column, task card, modal detail
├── pages/            # Halaman utama board
├── store/            # Logika state management & penyimpanan lokal
├── types/            # Definisi tipe data Task, Column, User, Label
└── theme/            # Pengaturan tema & gaya tampilan
```

---
