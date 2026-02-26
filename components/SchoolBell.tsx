import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bell, Clock, Settings, Play, Pause, Volume2, 
  Trash2, Plus, Fullscreen, Save, X, 
  VolumeX, Calendar, Music, Mic, History,
  AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BellScheduleItem, BellSettings } from '../types';
import { ttsService } from '../src/services/geminiTtsService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_BELL_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';

const SchoolBell: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [schedule, setSchedule] = useState<BellScheduleItem[]>([]);
  const [settings, setSettings] = useState<BellSettings>({
    isEnabled: true,
    volume: 0.8,
    soundType: 'default',
    daysActive: [1, 2, 3, 4, 5, 6],
  });
  const [editingItem, setEditingItem] = useState<Partial<BellScheduleItem> | null>(null);
  const [history, setHistory] = useState<{ id: string; time: string; label: string }[]>([]);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const ttsAudioRef = useRef<HTMLAudioElement>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedSchedule = localStorage.getItem('schoolBell_schedule');
    const savedSettings = localStorage.getItem('schoolBell_settings');
    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('schoolBell_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('schoolBell_settings', JSON.stringify(settings));
  }, [settings]);

  // Clock and Bell Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (!settings.isEnabled) return;

      const today = now.getDay();
      const currentTimeStr = format(now, 'HH:mm');
      const currentSeconds = now.getSeconds();

      // Only trigger at the start of the minute
      if (currentSeconds === 0) {
        const activeBells = schedule.filter(item => 
          item.time === currentTimeStr && 
          item.days.includes(today)
        );

        activeBells.forEach(bell => {
          // Prevent double trigger within the same minute
          const playKey = `${bell.id}-${currentTimeStr}`;
          if (lastPlayedId !== playKey) {
            playSound(bell);
            setLastPlayedId(playKey);
            addToHistory(bell);
          }
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [schedule, settings, lastPlayedId]);

  const addToHistory = (item: BellScheduleItem) => {
    const newEntry = {
      id: `hist-${Date.now()}`,
      time: format(new Date(), 'HH:mm:ss'),
      label: item.label
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 10));
  };

  const playSound = async (item: BellScheduleItem) => {
    if (!settings.isEnabled && !item.id) {
        // Allow manual test even if disabled
    } else if (!settings.isEnabled) {
        return;
    }

    // 1. Play Sound
    if (item.type === 'sound' || item.type === 'sound-and-tts') {
      if (audioRef.current) {
        audioRef.current.volume = settings.volume;
        audioRef.current.src = settings.soundType === 'custom' && settings.customSoundUrl 
          ? settings.customSoundUrl 
          : DEFAULT_BELL_SOUND;
        
        try {
          await audioRef.current.play();
        } catch (e) {
          console.error("Audio play error:", e);
        }
      }
    }

    // 2. Play TTS (after a short delay if sound is also playing)
    if (item.type === 'tts' || item.type === 'sound-and-tts') {
      const delay = item.type === 'sound-and-tts' ? 2000 : 0;
      
      setTimeout(async () => {
        setIsTtsLoading(true);
        const textToSpeak = item.sound || 'Bel sekolah berbunyi';
        const audioData = await ttsService.speak(textToSpeak);
        setIsTtsLoading(false);

        if (audioData && ttsAudioRef.current) {
          ttsAudioRef.current.src = audioData;
          ttsAudioRef.current.volume = settings.volume;
          try {
            await ttsAudioRef.current.play();
          } catch (e) {
            console.error("TTS play error:", e);
          }
        } else {
          // Fallback to browser TTS if Gemini fails
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = 'id-ID';
          utterance.volume = settings.volume;
          speechSynthesis.speak(utterance);
        }
      }, delay);
    }
  };

  const handleSaveItem = () => {
    if (!editingItem || !editingItem.time || !editingItem.label) return;

    const newItem: BellScheduleItem = {
      id: editingItem.id || `bell-${Date.now()}`,
      time: editingItem.time,
      label: editingItem.label,
      sound: editingItem.sound || 'Bel sekolah berbunyi',
      type: editingItem.type || 'sound',
      days: editingItem.days || [1, 2, 3, 4, 5],
    };

    if (editingItem.id) {
      setSchedule(schedule.map(item => item.id === editingItem.id ? newItem : item));
    } else {
      setSchedule([...schedule, newItem]);
    }
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setSchedule(schedule.filter(item => item.id !== id));
  };

  const toggleDay = (day: number) => {
    if (!editingItem) return;
    const currentDays = editingItem.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    setEditingItem({ ...editingItem, days: newDays });
  };

  const DAYS = [
    { id: 1, label: 'Sen' },
    { id: 2, label: 'Sel' },
    { id: 3, label: 'Rab' },
    { id: 4, label: 'Kam' },
    { id: 5, label: 'Jum' },
    { id: 6, label: 'Sab' },
    { id: 0, label: 'Min' },
  ];

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans p-4 md:p-8" id="school-bell-dashboard">
      <audio ref={audioRef} />
      <audio ref={ttsAudioRef} />
      
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter flex items-center gap-3">
            <Bell className="w-10 h-10" />
            BEL SEKOLAH
          </h1>
          <p className="text-sm opacity-60 font-mono mt-1">SISTEM OTOMASI PENJADWALAN V4.0</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Status Sistem</span>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border",
              settings.isEnabled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
            )}>
              <div className={cn("w-2 h-2 rounded-full", settings.isEnabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
              {settings.isEnabled ? 'OPERASIONAL' : 'NONAKTIF'}
            </div>
          </div>
          <button 
            onClick={() => document.documentElement.requestFullscreen()} 
            className="p-3 bg-white border border-[#141414]/10 rounded-xl hover:bg-[#141414] hover:text-white transition-all shadow-sm"
          >
            <Fullscreen className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Clock & Controls */}
        <div className="lg:col-span-4 space-y-8">
          {/* Real-time Clock Card */}
          <section className="bg-white border border-[#141414] p-8 rounded-2xl shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold opacity-50 uppercase tracking-widest font-mono">Waktu Lokal</span>
              <Clock className="w-4 h-4 opacity-30" />
            </div>
            <div className="text-7xl font-bold tracking-tighter font-mono tabular-nums leading-none">
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="mt-4 text-sm font-medium opacity-60">
              {format(currentTime, 'EEEE, d MMMM yyyy', { locale: id })}
            </div>
          </section>

          {/* Controls Card */}
          <section className="bg-white border border-[#141414]/10 p-6 rounded-2xl space-y-4 shadow-sm">
            <h2 className="text-xs font-bold opacity-50 uppercase tracking-widest font-mono mb-4">Panel Kontrol</h2>
            
            <button 
              onClick={() => setSettings(s => ({...s, isEnabled: !s.isEnabled}))}
              className={cn(
                "w-full py-4 px-6 rounded-xl font-bold flex items-center justify-between transition-all group",
                settings.isEnabled 
                  ? "bg-rose-500 text-white hover:bg-rose-600" 
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              )}
            >
              <div className="flex items-center gap-3">
                {settings.isEnabled ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{settings.isEnabled ? 'Matikan Sistem' : 'Aktifkan Sistem'}</span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings className="w-4 h-4" />
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => playSound({ type: 'sound', label: 'Test', sound: '', days: [], id: '', time: '' } as any)}
                className="py-3 px-4 bg-[#141414]/5 hover:bg-[#141414]/10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Music className="w-4 h-4" />
                Test Bel
              </button>
              <button 
                disabled={isTtsLoading}
                onClick={() => playSound({ type: 'tts', label: 'Test', sound: 'Tes pengumuman suara.', days: [], id: '', time: '' } as any)}
                className="py-3 px-4 bg-[#141414]/5 hover:bg-[#141414]/10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isTtsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                Test TTS
              </button>
            </div>

            <div className="pt-4 border-t border-[#141414]/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold opacity-50 uppercase font-mono">Volume</span>
                <span className="text-xs font-bold font-mono">{Math.round(settings.volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <VolumeX className="w-4 h-4 opacity-40" />
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={settings.volume}
                  onChange={(e) => setSettings({...settings, volume: parseFloat(e.target.value)})}
                  className="flex-1 h-1.5 bg-[#141414]/10 rounded-lg appearance-none cursor-pointer accent-[#141414]"
                />
                <Volume2 className="w-4 h-4 opacity-40" />
              </div>
            </div>
          </section>

          {/* History Card */}
          <section className="bg-white border border-[#141414]/10 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold opacity-50 uppercase tracking-widest font-mono">Riwayat Terakhir</h2>
              <History className="w-4 h-4 opacity-30" />
            </div>
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-xs opacity-40 italic text-center py-4">Belum ada aktivitas</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#141414]/5 last:border-0">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{item.label}</span>
                      <span className="text-[10px] opacity-40 font-mono">{item.time}</span>
                    </div>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Schedule List */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white border border-[#141414] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#141414]/10 flex flex-col md:flex-row justify-between items-start md:items-center bg-[#141414]/[0.02] gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Jadwal Bel Harian</h2>
                <p className="text-xs opacity-50 font-mono">TOTAL {schedule.length} JADWAL TERDAFTAR</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => {
                    const common = [
                      { time: '07:00', label: 'Masuk Sekolah', sound: 'Selamat pagi, saatnya masuk sekolah.', type: 'sound-and-tts' as const },
                      { time: '10:00', label: 'Istirahat', sound: 'Waktunya istirahat, selamat menikmati.', type: 'sound-and-tts' as const },
                      { time: '13:00', label: 'Pulang Sekolah', sound: 'Waktunya pulang, hati-hati di jalan.', type: 'sound-and-tts' as const },
                    ];
                    const newItems = common.map(c => ({ ...c, id: `bell-${Date.now()}-${Math.random()}`, days: [1,2,3,4,5] }));
                    setSchedule([...schedule, ...newItems]);
                  }}
                  className="flex items-center gap-2 bg-white border border-[#141414]/10 text-[#141414] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#141414]/5 transition-all"
                >
                  Template Umum
                </button>
                <button 
                  onClick={() => setEditingItem({ 
                    time: format(new Date(), 'HH:mm'), 
                    label: '', 
                    sound: 'Bel sekolah berbunyi', 
                    type: 'sound', 
                    days: [1, 2, 3, 4, 5] 
                  })} 
                  className="flex items-center gap-2 bg-[#141414] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#141414]/90 transition-all shadow-md active:scale-95"
                >
                  <Plus size={18}/> Tambah Jadwal
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse"> 
                <thead>
                  <tr className="bg-[#141414]/[0.02] text-[#141414]/40 text-[10px] font-bold uppercase tracking-widest">
                    <th className="px-6 py-4 border-b border-[#141414]/5">Waktu</th>
                    <th className="px-6 py-4 border-b border-[#141414]/5">Label & Tipe</th>
                    <th className="px-6 py-4 border-b border-[#141414]/5">Hari Aktif</th>
                    <th className="px-6 py-4 border-b border-[#141414]/5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/5">
                  {schedule.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center opacity-20">
                          <Bell className="w-12 h-12 mb-4" />
                          <p className="font-bold uppercase tracking-widest text-sm">Belum ada jadwal diatur</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    schedule.sort((a,b) => a.time.localeCompare(b.time)).map(item => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={item.id} 
                        className="hover:bg-[#141414]/[0.01] group transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#141414]/5 flex items-center justify-center font-mono font-bold text-sm">
                              {item.time}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{item.label}</span>
                            <div className="flex items-center gap-2 mt-1">
                              {item.type.includes('sound') && <Music className="w-3 h-3 opacity-40" />}
                              {item.type.includes('tts') && <Mic className="w-3 h-3 opacity-40" />}
                              <span className="text-[10px] uppercase font-bold opacity-30 tracking-tighter">
                                {item.type.replace('-', ' & ')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-1">
                            {DAYS.map(d => (
                              <div 
                                key={d.id} 
                                className={cn(
                                  "w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold border",
                                  item.days.includes(d.id) 
                                    ? "bg-[#141414] text-white border-[#141414]" 
                                    : "bg-transparent text-[#141414]/20 border-[#141414]/5"
                                )}
                              >
                                {d.label[0]}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditingItem(item)} 
                              className="p-2 text-[#141414]/40 hover:text-[#141414] hover:bg-[#141414]/5 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Settings size={16}/>
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item.id)} 
                              className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Hapus"
                            >
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Quick Tips / Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">Tips Otomasi</h4>
                <p className="text-xs text-emerald-700/70 mt-1">Gunakan fitur TTS untuk memberikan instruksi spesifik seperti "Waktunya istirahat, harap tertib".</p>
              </div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-900">Penjadwalan Fleksibel</h4>
                <p className="text-xs text-blue-700/70 mt-1">Anda dapat mengatur jadwal berbeda untuk hari Jumat atau Sabtu sesuai kebijakan sekolah.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Edit/Add */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden border border-[#141414]/10"
            >
              <div className="p-6 border-b border-[#141414]/5 flex justify-between items-center bg-[#141414]/[0.02]">
                <h3 className="text-xl font-bold tracking-tight">{editingItem.id ? 'Edit Jadwal Bel' : 'Tambah Jadwal Baru'}</h3>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-[#141414]/5 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-widest font-mono">Waktu (HH:MM)</label>
                    <input 
                      type="time" 
                      value={editingItem.time} 
                      onChange={e => setEditingItem({...editingItem, time: e.target.value})} 
                      className="w-full p-4 bg-[#141414]/5 border-0 rounded-2xl font-mono font-bold text-lg focus:ring-2 focus:ring-[#141414] transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-widest font-mono">Tipe Bel</label>
                    <select 
                      value={editingItem.type} 
                      onChange={e => setEditingItem({...editingItem, type: e.target.value as any})}
                      className="w-full p-4 bg-[#141414]/5 border-0 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#141414] appearance-none transition-all"
                    >
                      <option value="sound">Suara Bel Saja</option>
                      <option value="tts">TTS (Pengumuman)</option>
                      <option value="sound-and-tts">Bel & Pengumuman</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-widest font-mono">Label / Nama Kegiatan</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Masuk Kelas, Istirahat"
                    value={editingItem.label} 
                    onChange={e => setEditingItem({...editingItem, label: e.target.value})} 
                    className="w-full p-4 bg-[#141414]/5 border-0 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#141414] transition-all" 
                  />
                </div>

                {(editingItem.type === 'tts' || editingItem.type === 'sound-and-tts') && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-widest font-mono">Teks Pengumuman (TTS)</label>
                    <textarea 
                      placeholder="Masukkan teks yang akan diucapkan..."
                      value={editingItem.sound} 
                      onChange={e => setEditingItem({...editingItem, sound: e.target.value})} 
                      className="w-full p-4 bg-[#141414]/5 border-0 rounded-2xl font-medium text-sm focus:ring-2 focus:ring-[#141414] transition-all h-24 resize-none" 
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-widest font-mono">Hari Aktif</label>
                  <div className="flex justify-between gap-2">
                    {DAYS.map(d => (
                      <button
                        key={d.id}
                        onClick={() => toggleDay(d.id)}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-xs font-bold border transition-all",
                          editingItem.days?.includes(d.id)
                            ? "bg-[#141414] text-white border-[#141414]"
                            : "bg-transparent text-[#141414]/40 border-[#141414]/10 hover:border-[#141414]/30"
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setEditingItem(null)} 
                    className="flex-1 py-4 rounded-2xl bg-[#141414]/5 text-[#141414] font-bold hover:bg-[#141414]/10 transition-all flex items-center justify-center gap-2"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveItem} 
                    className="flex-1 py-4 rounded-2xl bg-[#141414] text-white font-bold hover:bg-[#141414]/90 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                  >
                    <Save size={18}/> Simpan Jadwal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchoolBell;
