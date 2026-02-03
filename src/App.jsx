import React, { useState, useEffect, useMemo } from 'react';
// Menggunakan ESM untuk library eksternal agar kompatibel dengan lingkungan preview
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import rehypeRaw from 'https://esm.sh/rehype-raw@7';
import { 
  Book, 
  Plus, 
  LogIn, 
  LogOut, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  Layout, 
  Save,
  Search,
  FileText,
  Monitor,
  Youtube
} from 'lucide-react';

// --- KONFIGURASI SUPABASE ---
// Menggunakan cara akses variabel lingkungan yang lebih kompatibel dengan target ES2015
// Jika dijalankan di lingkungan Vite/GitHub Actions, variabel VITE_ akan tersedia di objek env.
const getEnvVar = (name) => {
  try {
    // Mencoba akses via process.env atau import.meta.env secara aman
    return (typeof process !== 'undefined' && process.env && process.env[name]) || 
           (typeof window !== 'undefined' && window[name]) || 
           "";
  } catch (e) {
    return "";
  }
};

// Pastikan untuk mengisi nilai ini jika tidak menggunakan environment variables otomatis
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || ""; 
const supabaseKey = getEnvVar('VITE_SUPABASE_KEY') || ""; 
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const appId = typeof __app_id !== 'undefined' ? __app_id : 'litebooks-2026';

// --- MOCK DATA AWAL ---
const INITIAL_BOOKS = [
  {
    id: '1',
    title: 'Membangun Aplikasi dengan GitHub Pages & Custom DNS',
    description: 'Panduan lengkap cara deploy aplikasi front-end ke GitHub Pages dan menghubungkannya dengan domain kustom untuk profesionalisme.',
    category: 'DevOps',
    content: `
# Deploy ke GitHub Pages

GitHub Pages adalah layanan hosting situs statis yang sangat populer bagi pengembang.

## Langkah-langkah Utama:
1. Pastikan proyek Anda memiliki file \`index.html\` di root.
2. Masuk ke tab **Settings** di repositori GitHub Anda.
3. Cari menu **Pages** di sidebar kiri.
4. Pilih branch \`main\` dan folder \`/(root)\`, lalu klik **Save**.

### Menghubungkan Custom DNS
Untuk menggunakan domain kustom (misal: \`www.techtutorial.id\`), ikuti konfigurasi berikut:

- Tambahkan file \`CNAME\` di root repo berisi nama domain Anda.
- Atur **A Record** di panel DNS provider Anda ke IP GitHub (185.199.108.153).

![GitHub Pages Workflow](https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=800&auto=format&fit=crop)

### Video Tutorial Pendukung
Berikut adalah video singkat mengenai alur CI/CD ke GitHub Pages:

<div class="aspect-video w-full my-6">
  <iframe class="w-full h-full rounded-2xl shadow-lg" src="https://www.youtube.com/embed/2hLBe659cs0" frameborder="0" allowfullscreen></iframe>
</div>

---
*Tips: Selalu gunakan HTTPS untuk keamanan situs Anda.*
    `
  },
  {
    id: '2',
    title: 'Python Dasar & Fundamental',
    description: 'Kuasai konsep inti Python dari variabel, tipe data, hingga struktur kontrol untuk memulai karir sebagai pengembang.',
    category: 'Programming',
    content: `
# Python Fundamental

Python adalah bahasa pemrograman tingkat tinggi yang menekankan pada keterbacaan kode.

## Mengapa Python?
- Sintaksis yang mirip bahasa Inggris.
- Ekosistem pustaka (library) yang sangat luas.
- Digunakan luas di bidang **Data Science** dan **Backend Development**.

## Struktur Kode Dasar
Berikut adalah contoh implementasi logika sederhana:

\`\`\`python
# Menghitung nilai rata-rata mahasiswa
def hitung_rata_rata(nilai_list):
    total = sum(nilai_list)
    return total / len(nilai_list)

data_nilai = [80, 90, 75, 85, 95]
rata_rata = hitung_rata_rata(data_nilai)

print(f"Hasil rata-rata: {rata_rata}")
if rata_rata >= 80:
    print("Status: Sangat Baik")
else:
    print("Status: Perlu Peningkatan")
\`\`\`

### Tipe Data Koleksi
1. **List**: \`[1, 2, 3]\` (Dapat diubah)
2. **Tuple**: \`(1, 2, 3)\` (Tetap)
3. **Dictionary**: \`{"nama": "Andi"}\` (Key-Value)

> "Programming is not about what you know; it's about what you can figure out."
    `
  }
];

export default function App() {
  const [view, setView] = useState('catalog');
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState(INITIAL_BOOKS);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', content: '', category: 'General' });

  // Efek untuk mengatur Meta Data (Judul & Favicon)
  useEffect(() => {
    document.title = "LiteBooks - Digital Library";
    
    // Set Favicon secara dinamis sesuai permintaan
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/jpeg';
    link.rel = 'icon';
    link.href = '/public/logo.jpg';
    if (!document.querySelector("link[rel~='icon']")) {
      document.getElementsByTagName('head')[0].appendChild(link);
    } else {
      link.href = '/public/logo.jpg';
    }
  }, []);

  // Simulasi Persistensi Data menggunakan LocalStorage
  useEffect(() => {
    const savedBooks = localStorage.getItem(`${appId}_books`);
    if (savedBooks) {
      try {
        setBooks(JSON.parse(savedBooks));
      } catch (e) {
        console.error("Gagal memuat data lokal");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(`${appId}_books`, JSON.stringify(books));
  }, [books]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulasi Login Admin ITTS
    setUser({ email: 'admin@itts.ac.id', id: 'admin-1' });
    setView('catalog');
  };

  const handleLogout = () => {
    setUser(null);
    setView('catalog');
  };

  const handleSaveBook = () => {
    if (!formData.title || !formData.content) return;

    if (isEditing && selectedBook) {
      setBooks(books.map(b => b.id === selectedBook.id ? { ...formData, id: b.id } : b));
    } else {
      const newBook = { ...formData, id: Date.now().toString() };
      setBooks([newBook, ...books]);
    }
    setView('catalog');
    setFormData({ title: '', description: '', content: '', category: 'General' });
  };

  const deleteBook = (id, e) => {
    e.stopPropagation();
    if(window.confirm('Hapus materi ini selamanya?')) {
      setBooks(books.filter(b => b.id !== id));
    }
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setView('catalog')}
          >
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-indigo-100/50">
              <Book className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">LiteBooks</h1>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    setFormData({ title: '', description: '', content: '', category: 'General' });
                    setIsEditing(false);
                    setView('editor');
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  <Plus size={16} /> Materi Baru
                </button>
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                <span className="text-sm text-slate-500 font-medium hidden lg:block">{user.email}</span>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setView('login')}
                className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold transition"
              >
                <LogIn size={20} /> Admin Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* CATALOG VIEW */}
        {view === 'catalog' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Pustaka Digital</h2>
                <p className="text-slate-500">Kumpulan dokumentasi teknis dan fundamental pemrograman terupdate 2026.</p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari materi..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBooks.length > 0 ? filteredBooks.map(book => (
                <div 
                  key={book.id}
                  className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden"
                  onClick={() => { setSelectedBook(book); setView('reader'); }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                      {book.category}
                    </span>
                    {user && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedBook(book); setFormData(book); setIsEditing(true); setView('editor'); }}
                          className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={(e) => deleteBook(book.id, e)}
                          className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition leading-tight">
                    {book.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">
                    {book.description}
                  </p>
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                    Mulai Membaca <ChevronLeft size={16} className="rotate-180" />
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center text-slate-400 font-medium italic">
                  Tidak ada materi yang ditemukan.
                </div>
              )}
            </div>
          </div>
        )}

        {/* READER VIEW */}
        {view === 'reader' && selectedBook && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setView('catalog')}
              className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-10 font-bold transition group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Katalog
            </button>

            <article className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="h-4 bg-indigo-600 w-full"></div>
              <div className="p-10 md:p-16">
                <div className="mb-12">
                  <span className="text-indigo-600 font-black tracking-[0.2em] text-xs uppercase mb-4 block">
                    {selectedBook.category}
                  </span>
                  <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-[1.1]">
                    {selectedBook.title}
                  </h1>
                  <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl border-l-4 border-slate-100 pl-6">
                    {selectedBook.description}
                  </p>
                </div>

                <div className="prose prose-lg prose-slate max-w-none 
                  prose-headings:text-slate-900 prose-headings:font-bold
                  prose-p:text-slate-600 prose-p:leading-8
                  prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-lg
                  prose-pre:bg-slate-900 prose-pre:rounded-2xl prose-pre:p-6 prose-pre:shadow-2xl
                  prose-blockquote:border-indigo-200 prose-blockquote:bg-indigo-50/30 prose-blockquote:p-6 prose-blockquote:rounded-2xl">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    rehypePlugins={[rehypeRaw]}
                  >
                    {selectedBook.content}
                  </ReactMarkdown>
                </div>
              </div>
            </article>
            
            <footer className="mt-16 text-center border-t border-slate-200 pt-10 pb-20">
              <p className="text-slate-400 text-sm mb-4">UAS Pemrograman Front-End • 2026</p>
              <div className="flex justify-center gap-6">
                <Monitor className="text-slate-300 w-5 h-5" />
                <Youtube className="text-slate-300 w-5 h-5" />
                <FileText className="text-slate-300 w-5 h-5" />
              </div>
            </footer>
          </div>
        )}

        {/* EDITOR VIEW */}
        {view === 'editor' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <Layout className="text-indigo-600" /> {isEditing ? 'Perbarui Materi' : 'Publikasi Baru'}
              </h2>
              <button onClick={() => setView('catalog')} className="text-slate-400 font-bold hover:text-slate-600 transition">Batal</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Judul Materi</label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition font-bold text-lg"
                      placeholder="Judul menarik..."
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Kategori</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option>General</option>
                      <option>Programming</option>
                      <option>DevOps</option>
                      <option>UI/UX</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Deskripsi Singkat</label>
                    <textarea 
                      rows="3"
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm leading-relaxed"
                      placeholder="Ringkasan materi..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Konten (Markdown)</label>
                    <textarea 
                      rows="12"
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition font-mono text-sm leading-relaxed"
                      placeholder="# Mulai menulis..."
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                    />
                  </div>
                  <button 
                    onClick={handleSaveBook}
                    className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition active:scale-95"
                  >
                    <Save size={24} /> {isEditing ? 'Simpan Perubahan' : 'Terbitkan Sekarang'}
                  </button>
                </div>
              </div>

              <div className="hidden lg:block bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] p-10 overflow-y-auto max-h-[90vh] sticky top-28">
                <span className="inline-block bg-indigo-100 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full mb-6 tracking-widest">LIVE PREVIEW</span>
                <div className="prose prose-slate prose-indigo max-w-none">
                  <h1 className="text-3xl font-black mb-4">{formData.title || 'Judul Materi'}</h1>
                  <p className="text-slate-400 italic mb-8 border-l-4 border-indigo-100 pl-4">{formData.description || 'Deskripsi...'}</p>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {formData.content || '_Pratinjau konten akan muncul di sini..._'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOGIN VIEW */}
        {view === 'login' && (
          <div className="max-w-md mx-auto mt-16 animate-in zoom-in-95 duration-300">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
              <div className="inline-flex bg-indigo-50 p-6 rounded-[2rem] mb-8">
                <LogIn className="text-indigo-600" size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Login Admin</h2>
              <p className="text-slate-500 mb-10 font-medium">Masuk untuk mengelola LiteBooks.</p>
              
              <form onSubmit={handleLogin} className="space-y-6 text-left">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Email ITTS</label>
                  <input 
                    type="email" 
                    defaultValue="admin@itts.ac.id"
                    disabled
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Password</label>
                  <input 
                    type="password" 
                    defaultValue="••••••••"
                    disabled
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold opacity-60"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition"
                >
                  Masuk Sekarang
                </button>
              </form>
              <div className="mt-10 pt-8 border-t border-slate-100 text-xs text-slate-400 font-medium uppercase tracking-tighter">
                UAS Front-End ITTS 2026
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}