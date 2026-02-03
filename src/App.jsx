import React, { useState, useEffect, useMemo } from 'react';
// PERBAIKAN: Menggunakan import dari npm
import { createClient } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  Book, Plus, LogIn, LogOut, Trash2, Edit3, ChevronLeft, Layout, Save, Search, AlertCircle, Loader2, Database, Eye, EyeOff
} from 'lucide-react';

// --- KONFIGURASI SUPABASE ---
const getSupabaseConfig = () => {
  let url = "";
  let key = "";
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      url = import.meta.env.VITE_SUPABASE_URL;
      key = import.meta.env.VITE_SUPABASE_KEY;
    } else if (typeof process !== 'undefined' && process.env) {
      url = process.env.VITE_SUPABASE_URL;
      key = process.env.VITE_SUPABASE_KEY;
    }
  } catch (e) {
    console.warn("Gagal memuat environment variables:", e);
  }
  return { url, key };
};

const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
// Cek apakah variabel ada isinya
const isConfigured = supabaseUrl && supabaseKey;
const supabase = isConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// --- DATA SAMPEL (Muncul jika Database Kosong) ---
const INITIAL_BOOKS = [
  {
    id: 'sample-1',
    isLocal: true, // Penanda bahwa ini data lokal
    title: 'Membangun Aplikasi dengan GitHub Pages & Custom DNS',
    description: 'Panduan teknis langkah-demi-langkah untuk melakukan deployment aplikasi React/Vite ke GitHub Pages secara otomatis.',
    category: 'DevOps',
    content: `
# Panduan Deployment ke GitHub Pages

GitHub Pages merupakan solusi alternatif hosting statis gratis. Berikut adalah alur kerja profesional untuk mengunggah aplikasi **LiteBooks** Anda.

## 1. Instalasi Dependensi
Jalankan perintah berikut:
\`\`\`bash
npm install gh-pages --save-dev
\`\`\`

## 2. Konfigurasi Manifest (\`package.json\`)
Tambahkan script berikut:
\`\`\`json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
\`\`\`

## 3. GitHub Actions (Otomatisasi)
Pastikan Anda memiliki file \`.github/workflows/deploy.yml\` agar secrets Supabase terbaca saat build.

### Video Tutorial
<div class="aspect-video w-full my-6">
  <iframe class="w-full h-full rounded-2xl shadow-lg" src="https://www.youtube.com/embed/2hLBe659cs0" frameborder="0" allowfullscreen></iframe>
</div>
    `
  },
  {
    id: 'sample-2',
    isLocal: true,
    title: 'Python Dasar & Fundamental',
    description: 'Kuasai konsep inti Python dari variabel, tipe data, hingga struktur kontrol untuk memulai karir sebagai pengembang.',
    category: 'Programming',
    content: `
# Python Fundamental

Python adalah bahasa pemrograman tingkat tinggi yang menekankan pada keterbacaan kode.

## Struktur Kode Dasar
\`\`\`python
def hitung_rata_rata(nilai_list):
    total = sum(nilai_list)
    return total / len(nilai_list)

print(f"Hasil: {hitung_rata_rata([80, 90, 75])}")
\`\`\`

> "Programming is not about what you know; it's about what you can figure out."
    `
  }
];

export default function App() {
  const [view, setView] = useState('catalog');
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true); // Default loading true
  const [authLoading, setAuthLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', description: '', content: '', category: 'General', is_hidden: false });
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  useEffect(() => {
    document.title = "LiteBooks - Mini Books";
    
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
      setBooks(INITIAL_BOOKS); // Fallback jika supabase mati
    }
  }, []);

  const fetchBooks = async () => {
    // PENTING: Cegah loading selamanya jika config kosong
    if (!supabase) {
      console.warn("Supabase Config Missing");
      setBooks(INITIAL_BOOKS);
      setLoading(false); // Spinner berhenti
      return;
    }

    setLoading(true);
    // 1. Coba ambil data dari DB
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) {
      // 2. Jika DB KOSONG, lakukan Auto-Seeding (Insert otomatis)
      if (data.length === 0) {
        console.log("Database kosong. Memulai inisialisasi data (Auto-Seeding)...");
        
        // Siapkan data: Hapus ID (biar DB generate UUID baru) dan isLocal
        const seedData = INITIAL_BOOKS.map(({ id, isLocal, ...book }) => ({
          ...book,
          is_hidden: false // Pastikan kolom is_hidden terisi
        }));

        // Insert ke Supabase
        const { error: seedError } = await supabase.from('books').insert(seedData);
        
        if (!seedError) {
          console.log("Auto-Seeding berhasil. Mengambil data baru...");
          // 3. Ambil ulang data yang baru saja di-insert agar kita dapat UUID aslinya
          const { data: freshData } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });
            
          setBooks(freshData || []); 
        } else {
          console.error("Gagal Auto-Seeding:", seedError);
          // Fallback: Tampilkan data lokal saja jika gagal insert (misal karena RLS memblokir)
          setBooks(INITIAL_BOOKS);
        }
      } else {
        // Jika DB tidak kosong, gunakan data DB
        setBooks(data);
      }
    } else {
      console.error("Error fetching books:", error);
      // Fallback jika koneksi error
      setBooks(INITIAL_BOOKS);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) return alert("Error: Koneksi Supabase terputus.");
    
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });
    
    if (error) alert("Gagal Masuk: " + error.message);
    else setView('catalog');
    
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setView('catalog');
  };

  // CRUD Logic
  const handleSaveBook = async () => {
    if (!formData.title || !formData.content || !supabase) return;
    setLoading(true);
    
    const payload = { 
      title: formData.title,
      description: formData.description,
      content: formData.content,
      category: formData.category,
      is_hidden: formData.is_hidden
    };
    
    let error;
    // Cek ID: Pastikan kita update berdasarkan UUID dari DB, bukan ID sampel
    if (isEditing && selectedBook && !selectedBook.isLocal) {
      const { error: updateError } = await supabase.from('books').update(payload).eq('id', selectedBook.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('books').insert([payload]);
      error = insertError;
    }

    if (error) {
      alert("Gagal Simpan: " + error.message + "\n(Pastikan tabel 'books' memiliki kolom yang sesuai)");
    } else {
      await fetchBooks();
      setView('catalog');
      setFormData({ title: '', description: '', content: '', category: 'General', is_hidden: false });
    }
    setLoading(false);
  };

  const deleteBook = async (id, isLocal, e) => {
    e.stopPropagation();
    if (isLocal) {
      // Jika masih dalam mode fallback lokal
      if(window.confirm('Sembunyikan materi sampel ini?')) setBooks(books.filter(b => b.id !== id));
      return;
    }
    if (!supabase) return;
    if(window.confirm('Hapus materi ini secara permanen?')) {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (!error) fetchBooks();
      else alert("Gagal Hapus: " + error.message);
    }
  };

  const toggleVisibility = async (book, e) => {
    e.stopPropagation();
    if (book.isLocal) return alert("Data sampel (Lokal) tidak bisa diubah statusnya. Silakan refresh halaman jika data sudah tersinkron ke DB.");
    if (!supabase) return;

    const newStatus = !book.is_hidden;
    setBooks(books.map(b => b.id === book.id ? { ...b, is_hidden: newStatus } : b));

    const { error } = await supabase.from('books').update({ is_hidden: newStatus }).eq('id', book.id);
    if (error) {
      alert("Gagal update status: " + error.message);
      fetchBooks(); 
    }
  };

  // --- FILTERS & VIEW HELPERS ---
  const filteredBooks = useMemo(() => {
    let result = books;
    
    if (searchQuery) {
      result = result.filter(b => 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (!user) {
      result = result.filter(b => !b.is_hidden);
    }
    
    return result;
  }, [books, searchQuery, user]);

  const openEditor = (book = null) => {
    if (book) {
      setIsEditing(true);
      setSelectedBook(book);
      setFormData({ 
        title: book.title, 
        description: book.description || '', 
        content: book.content || '', 
        category: book.category || 'General',
        is_hidden: book.is_hidden || false
      });
    } else {
      setIsEditing(false);
      setSelectedBook(null);
      setFormData({ title: '', description: '', content: '', category: 'General', is_hidden: false });
    }
    setView('editor');
  };

  const openReader = (book) => {
    setSelectedBook(book);
    setView('reader');
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('catalog')}>
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100/50">
              <Book className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight hidden md:block">LiteBooks</h1>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {user ? (
              <div className="flex items-center gap-2 md:gap-4">
                <button onClick={() => openEditor()} className="bg-indigo-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2">
                  <Plus size={16} /> <span className="hidden sm:inline">Materi Baru</span>
                </button>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition p-2"><LogOut size={20} /></button>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold transition px-2">
                <LogIn size={20} /> <span className="hidden sm:inline">Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {!isConfigured && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 text-amber-800 text-sm">
            <AlertCircle size={20} />
            <div>
              <span className="font-bold">Mode Demo Lokal.</span> Database belum terhubung (Cek Secrets di GitHub).
            </div>
          </div>
        )}

        {view === 'catalog' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-2">Pustaka Digital</h2>
                <p className="text-slate-500">Kumpulan dokumentasi teknis real-time.</p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Cari materi..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </header>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
                <p className="text-slate-400 font-medium">Memuat Pustaka...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredBooks.map(book => (
                  <div key={book.id} className={`bg-white border ${book.is_hidden ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'} rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative flex flex-col h-full`} onClick={() => openReader(book)}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-2 items-center">
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">{book.category}</span>
                        {/* Jika data masih lokal, tampilkan badge Sampel */}
                        {book.isLocal && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1.5 rounded-full flex items-center gap-1"><Database size={10} /> Sampel</span>}
                        {book.is_hidden && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1.5 rounded-full flex items-center gap-1"><EyeOff size={10} /> Hidden</span>}
                      </div>
                      
                      {user && (
                        <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          {!book.isLocal && (
                            <button onClick={(e) => toggleVisibility(book, e)} className="p-2 bg-slate-50 text-slate-400 hover:text-amber-600 rounded-xl hover:bg-amber-50" title={book.is_hidden ? "Tampilkan" : "Sembunyikan"}>
                              {book.is_hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); openEditor(book); }} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50"><Edit3 size={16} /></button>
                          <button onClick={(e) => deleteBook(book.id, book.isLocal, e)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition leading-tight">{book.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">{book.description}</p>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mt-auto">Mulai Membaca <ChevronLeft size={16} className="rotate-180" /></div>
                  </div>
                ))}
                {filteredBooks.length === 0 && (
                   <div className="col-span-full py-20 text-center text-slate-400 font-medium italic">Tidak ada materi ditemukan.</div>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'reader' && selectedBook && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => setView('catalog')} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-8 font-bold transition group">
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Katalog
            </button>
            <article className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="h-4 bg-indigo-600 w-full"></div>
              <div className="p-8 md:p-16">
                <header className="mb-10 pb-8 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-indigo-600 font-black tracking-[0.2em] text-xs uppercase block">{selectedBook.category}</span>
                    {selectedBook.is_hidden && <span className="text-amber-600 text-xs font-bold flex items-center gap-1"><EyeOff size={14} /> Hidden Mode</span>}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">{selectedBook.title}</h1>
                  <p className="text-lg text-slate-500 font-medium leading-relaxed">{selectedBook.description}</p>
                </header>
                <div className="prose prose-lg prose-slate max-w-none prose-pre:bg-slate-900 prose-pre:rounded-2xl">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {selectedBook.content || ''}
                  </ReactMarkdown>
                </div>
              </div>
            </article>
          </div>
        )}

        {view === 'editor' && (
          <div className="animate-in fade-in duration-300">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Layout className="text-indigo-600" /> {isEditing ? 'Edit Materi' : 'Buat Materi Baru'}</h2>
                <button onClick={() => setView('catalog')} className="text-slate-400 font-bold hover:text-slate-600 transition">Batal</button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm h-fit">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Judul</label>
                  <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg" placeholder="Judul Materi" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Kategori</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option>Programming</option><option>DevOps</option><option>UI/UX</option><option>General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Visibilitas</label>
                    <div 
                      className={`w-full p-4 border rounded-2xl cursor-pointer flex items-center justify-between ${formData.is_hidden ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}
                      onClick={() => setFormData({...formData, is_hidden: !formData.is_hidden})}
                    >
                      <span className="font-bold text-sm">{formData.is_hidden ? 'Tersembunyi (Private)' : 'Publik (Show)'}</span>
                      {formData.is_hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Deskripsi Singkat</label>
                  <textarea rows="3" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm" placeholder="Ringkasan..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Konten (Markdown)</label>
                  <textarea rows="15" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-mono text-sm" placeholder="# Mulai menulis..." value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} />
                </div>

                <button onClick={handleSaveBook} disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition flex justify-center items-center gap-2 shadow-xl shadow-indigo-100">
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} {isEditing && !selectedBook?.isLocal ? 'Simpan Perubahan' : 'Simpan ke Database'}
                </button>
              </div>

              <div className="hidden lg:block">
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 h-full max-h-[85vh] overflow-y-auto prose prose-slate">
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-6 block">LIVE PREVIEW</span>
                  <h1>{formData.title || 'Judul Materi'}</h1>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{formData.content || '_Pratinjau konten akan muncul di sini..._'}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'login' && (
          <div className="max-w-md mx-auto mt-10 md:mt-20 animate-in zoom-in-95 duration-300">
            <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
              <div className="inline-flex bg-indigo-50 p-6 rounded-[2rem] mb-6"><LogIn className="text-indigo-600" size={32} /></div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Admin Login</h2>
              <p className="text-slate-500 mb-8 text-sm">Masuk untuk mengelola konten.</p>
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} />
                <input type="password" placeholder="Sandi" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} />
                <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition shadow-xl flex justify-center items-center">
                  {authLoading ? <Loader2 className="animate-spin" /> : "Masuk"}
                </button>
              </form>
              <button onClick={() => setView('catalog')} className="mt-6 text-slate-400 hover:text-slate-600 text-sm font-bold">Kembali ke Katalog</button>
            </div>
          </div>
        )}
      </main>
      <footer className="text-center py-10 text-slate-400 text-xs font-medium uppercase tracking-widest border-t border-slate-100 mt-10">
        UAS Front-End ITTS • 2026
      </footer>
    </div>
  );
}