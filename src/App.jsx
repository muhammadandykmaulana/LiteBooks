import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import rehypeRaw from 'https://esm.sh/rehype-raw@7';
import { 
  Book, Plus, LogIn, LogOut, Trash2, Edit3, ChevronLeft, Layout, Save, Search, AlertCircle, Loader2, Database
} from 'lucide-react';

// --- KONFIGURASI SUPABASE ---
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
  
  const [formData, setFormData] = useState({ title: '', description: '', content: '', category: 'General' });
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
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) {
      // LOGIKA Jika database kosong, tampilkan INITIAL_BOOKS
      if (data.length === 0) {
        setBooks(INITIAL_BOOKS);
      } else {
        setBooks(data);
      }
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
    
    // Hapus properti ID jika itu adalah data sampel (agar dibuatkan ID baru oleh DB)
    const payload = { 
      title: formData.title,
      description: formData.description,
      content: formData.content,
      category: formData.category
    };
    
    let error;
    // Jika sedang edit DAN bukan data sampel lokal (artinya data dari DB)
    if (isEditing && selectedBook && !selectedBook.isLocal) {
      const { error: updateError } = await supabase.from('books').update(payload).eq('id', selectedBook.id);
      error = updateError;
    } else {
      // Jika data baru ATAU data sampel yang diedit (Save as new)
      const { error: insertError } = await supabase.from('books').insert([payload]);
      error = insertError;
    }

    if (error) alert("Gagal Simpan: " + error.message);
    else {
      await fetchBooks(); // Refresh data dari DB
      setView('catalog');
      setFormData({ title: '', description: '', content: '', category: 'General' });
    }
    setLoading(false);
  };

  const deleteBook = async (id, isLocal, e) => {
    e.stopPropagation();
    // Jika data lokal, hapus dari state saja sementara
    if (isLocal) {
      if(window.confirm('Sembunyikan materi sampel ini?')) {
        setBooks(books.filter(b => b.id !== id));
      }
      return;
    }

    if (!supabase) return;
    if(window.confirm('Hapus materi ini secara permanen dari database?')) {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (!error) fetchBooks();
      else alert("Gagal Hapus: " + error.message);
    }
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);

  // View Helpers
  const openEditor = (book = null) => {
    if (book) {
      setIsEditing(true);
      setSelectedBook(book);
      setFormData({ 
        title: book.title, 
        description: book.description, 
        content: book.content, 
        category: book.category 
      });
    } else {
      setIsEditing(false);
      setFormData({ title: '', description: '', content: '', category: 'General' });
    }
    setView('editor');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('catalog')}>
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100/50">
              <Book className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">LiteBooks</h1>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <button onClick={() => openEditor()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2">
                  <Plus size={16} /> Materi Baru
                </button>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition"><LogOut size={20} /></button>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold transition">
                <LogIn size={20} /> Admin Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {!isConfigured && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4">
            <AlertCircle className="text-red-600" size={24} />
            <div>
              <h3 className="font-bold text-red-900">Koneksi Database Terputus</h3>
              <p className="text-red-700 text-sm">Pastikan Secrets sudah diatur di GitHub Settings.</p>
            </div>
          </div>
        )}

        {view === 'catalog' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Pustaka Digital</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBooks.map(book => (
                  <div key={book.id} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative" onClick={() => { setSelectedBook(book); setView('reader'); }}>
                    <div className="flex justify-between items-start mb-6">
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">{book.category}</span>
                      {/* Tanda Sampel Data */}
                      {book.isLocal && (
                         <span className="ml-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1.5 rounded-full flex items-center gap-1">
                           <Database size={10} /> Sampel
                         </span>
                      )}
                      
                      {user && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          <button onClick={(e) => { e.stopPropagation(); openEditor(book); }} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50"><Edit3 size={16} /></button>
                          <button onClick={(e) => deleteBook(book.id, book.isLocal, e)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition leading-tight">{book.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">{book.description}</p>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">Mulai Membaca <ChevronLeft size={16} className="rotate-180" /></div>
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
            <button onClick={() => setView('catalog')} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-10 font-bold transition group">
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Katalog
            </button>
            <article className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="h-4 bg-indigo-600 w-full"></div>
              <div className="p-10 md:p-16">
                <header className="mb-12">
                  <span className="text-indigo-600 font-black tracking-[0.2em] text-xs uppercase mb-4 block">{selectedBook.category}</span>
                  <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-[1.1]">{selectedBook.title}</h1>
                </header>
                <div className="prose prose-lg prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {selectedBook.content}
                  </ReactMarkdown>
                </div>
              </div>
            </article>
          </div>
        )}

        {view === 'editor' && (
          <div className="animate-in fade-in duration-300">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg" placeholder="Judul Materi" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                 <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  <option>Programming</option><option>DevOps</option><option>UI/UX</option><option>General</option>
                </select>
                <textarea rows="15" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-mono text-sm" placeholder="# Konten..." value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} />
                <button onClick={handleSaveBook} disabled={loading} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />} {isEditing && !selectedBook?.isLocal ? 'Simpan Perubahan' : 'Simpan ke Database'}
                </button>
              </div>
              <div className="hidden lg:block prose prose-slate p-10 bg-white border border-slate-200 rounded-[2.5rem] overflow-y-auto max-h-[90vh]">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{formData.content || '_Pratinjau..._'}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {view === 'login' && (
          <div className="max-w-md mx-auto mt-16">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100">
              <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">Admin Login</h2>
              <form onSubmit={handleLogin} className="space-y-6">
                <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} />
                <input type="password" placeholder="Sandi" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} />
                <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-indigo-700 transition">
                  {authLoading ? <Loader2 className="animate-spin mx-auto" /> : "Masuk"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
      <footer className="text-center py-10 text-slate-400 text-xs font-medium uppercase tracking-widest">
        UAS Front-End ITTS • 2026
      </footer>
    </div>
  );
}