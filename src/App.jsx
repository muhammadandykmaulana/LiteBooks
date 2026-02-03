import React, { useState, useEffect, useMemo } from 'react';
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
  Youtube,
  Loader2
} from 'lucide-react';

// --- KONFIGURASI SUPABASE ---
const getEnvVar = (name) => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[name]) || 
           (typeof window !== 'undefined' && window[name]) || 
           "";
  } catch (e) {
    return "";
  }
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || ""; 
const supabaseKey = getEnvVar('VITE_SUPABASE_KEY') || ""; 
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default function App() {
  const [view, setView] = useState('catalog');
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ title: '', description: '', content: '', category: 'General' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // 1. Inisialisasi Auth & Meta
  useEffect(() => {
    document.title = "LiteBooks - Digital Library";
    
    // Cek Session Aktif
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // 2. Fetch Data dari Supabase
  const fetchBooks = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setBooks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // 3. Login dengan Supabase Auth
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });

    if (error) {
      alert("Gagal Masuk: " + error.message);
    } else {
      setView('catalog');
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setView('catalog');
  };

  // 4. CRUD Logic dengan Supabase
  const handleSaveBook = async () => {
    if (!formData.title || !formData.content || !supabase) return;

    setLoading(true);
    if (isEditing && selectedBook) {
      const { error } = await supabase
        .from('books')
        .update(formData)
        .eq('id', selectedBook.id);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase
        .from('books')
        .insert([formData]);
      if (error) alert(error.message);
    }
    
    await fetchBooks();
    setView('catalog');
    setFormData({ title: '', description: '', content: '', category: 'General' });
    setLoading(false);
  };

  const deleteBook = async (id, e) => {
    e.stopPropagation();
    if (!supabase) return;
    if(window.confirm('Hapus materi ini secara permanen dari database?')) {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (!error) fetchBooks();
      else alert(error.message);
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
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('catalog')}>
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-indigo-100/50">
              <Book className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">LiteBooks</h1>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setFormData({ title: '', description: '', content: '', category: 'General' }); setIsEditing(false); setView('editor'); }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  <Plus size={16} /> Materi Baru
                </button>
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold transition">
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
                <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">LiteBooks</h2>
                <p className="text-slate-500">Kumpulan dokumentasi teknis TI</p>
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

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
                <p className="text-slate-400 font-medium">Sinkronisasi Database...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBooks.length > 0 ? filteredBooks.map(book => (
                  <div key={book.id} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative" onClick={() => { setSelectedBook(book); setView('reader'); }}>
                    <div className="flex justify-between items-start mb-6">
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">{book.category}</span>
                      {user && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedBook(book); setFormData(book); setIsEditing(true); setView('editor'); }} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50"><Edit3 size={16} /></button>
                          <button onClick={(e) => deleteBook(book.id, e)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition leading-tight">{book.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">{book.description}</p>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">Mulai Membaca <ChevronLeft size={16} className="rotate-180" /></div>
                  </div>
                )) : (
                  <div className="col-span-full py-20 text-center text-slate-400 font-medium italic">Data materi kosong di Supabase.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* READER VIEW */}
        {view === 'reader' && selectedBook && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => setView('catalog')} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-10 font-bold transition group">
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Katalog
            </button>
            <article className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="h-4 bg-indigo-600 w-full"></div>
              <div className="p-10 md:p-16">
                <header className="mb-12">
                  <span className="text-indigo-600 font-black tracking-[0.2em] text-xs uppercase mb-4 block">KATEGORI: {selectedBook.category}</span>
                  <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-[1.1]">{selectedBook.title}</h1>
                  <p className="text-xl text-slate-500 font-medium leading-relaxed border-l-4 border-slate-100 pl-6">{selectedBook.description}</p>
                </header>
                <div className="prose prose-lg prose-slate max-w-none prose-pre:bg-slate-900 prose-pre:rounded-2xl">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {selectedBook.content}
                  </ReactMarkdown>
                </div>
              </div>
            </article>
            <footer className="mt-16 text-center border-t border-slate-200 pt-10 pb-20">
              <p className="text-slate-400 text-sm mb-4">UAS Front-End Informatika ITTS • 2026</p>
            </footer>
          </div>
        )}

        {/* EDITOR VIEW */}
        {view === 'editor' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3"><Layout className="text-indigo-600" /> {isEditing ? 'Perbarui Materi' : 'Publikasi Baru'}</h2>
              <button onClick={() => setView('catalog')} className="text-slate-400 font-bold hover:text-slate-600 transition">Batal</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8 bg-white p-8 rounded-[2rem] border border-slate-200">
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg" placeholder="Judul Materi" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  <option>Programming</option><option>DevOps</option><option>UI/UX</option><option>General</option>
                </select>
                <textarea rows="3" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" placeholder="Deskripsi materi..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <textarea rows="10" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-mono text-sm" placeholder="# Konten Markdown..." value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} />
                <button onClick={handleSaveBook} disabled={loading} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />} {isEditing ? 'Simpan Perubahan' : 'Terbitkan Sekarang'}
                </button>
              </div>
              <div className="hidden lg:block bg-indigo-50/50 rounded-[2.5rem] p-10 overflow-y-auto max-h-[90vh] sticky top-28 prose prose-slate">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 block">LIVE PREVIEW</span>
                <h1>{formData.title || 'Judul Materi'}</h1>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{formData.content || '_Tulis sesuatu..._'}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* LOGIN VIEW */}
        {view === 'login' && (
          <div className="max-w-md mx-auto mt-16 animate-in zoom-in-95 duration-300">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
              <div className="inline-flex bg-indigo-50 p-6 rounded-[2rem] mb-8"><LogIn className="text-indigo-600" size={40} /></div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Login Admin</h2>
              <form onSubmit={handleLogin} className="space-y-6 text-left mt-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Email ITTS</label>
                  <input type="email" placeholder="admin@example.com" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Sandi</label>
                  <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} />
                </div>
                <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 flex justify-center items-center">
                  {authLoading ? <Loader2 className="animate-spin" /> : "Masuk Sekarang"}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}