import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, Settings, Play, Pause, Volume2, Upload, Trash2, Plus, Fullscreen, Save, X } from 'lucide-react';
import { BellScheduleItem, BellSettings } from '../types';

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
  const audioRef = useRef<HTMLAudioElement>(null);

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
      const currentTimeStr = now.toTimeString().slice(0, 5);

      const activeBell = schedule.find(item => 
        item.time === currentTimeStr && 
        item.days.includes(today)
      );

      if (activeBell) {
        playSound(activeBell);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTime, schedule, settings]);

  const playSound = (item: BellScheduleItem) => {
    if (audioRef.current) {
      audioRef.current.volume = settings.volume;
      if (item.type.includes('sound')) {
        // This is a simplified version. A real implementation would handle custom sounds.
        audioRef.current.src = '/assets/bell.mp3'; // Assuming a default bell sound
        audioRef.current.play();
      }
      if (item.type.includes('tts')) {
        const utterance = new SpeechSynthesisUtterance(item.sound);
        utterance.lang = 'id-ID';
        utterance.volume = settings.volume;
        speechSynthesis.speak(utterance);
      }
    }
  };

  const handleSaveItem = () => {
    if (!editingItem || !editingItem.time || !editingItem.label) return;

    if (editingItem.id) {
      setSchedule(schedule.map(item => item.id === editingItem.id ? (editingItem as BellScheduleItem) : item));
    } else {
      setSchedule([...schedule, { ...editingItem, id: `bell-${Date.now()}` } as BellScheduleItem]);
    }
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setSchedule(schedule.filter(item => item.id !== id));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full animate-fade-in" id="school-bell-view">
      <audio ref={audioRef} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Bell className="mr-3 text-blue-500" />
          Bel Sekolah Otomatis
        </h1>
        <button onClick={() => document.documentElement.requestFullscreen()} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100" title="Mode Layar Penuh">
          <Fullscreen />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <h2 className="text-lg font-semibold text-gray-600">Waktu Sekarang</h2>
            <div className="text-6xl font-bold text-blue-600 my-4 font-mono tracking-tight">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className={`p-2 rounded-full text-sm font-bold inline-flex items-center ${settings.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {settings.isEnabled ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
              Status: {settings.isEnabled ? 'Aktif' : 'Nonaktif'}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-lg font-semibold text-gray-600 mb-4">Kontrol</h2>
             <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => setSettings(s => ({...s, isEnabled: !s.isEnabled}))}
                  className={`w-full py-3 px-4 rounded-lg font-bold text-white flex items-center justify-center transition-all ${settings.isEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  {settings.isEnabled ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                  {settings.isEnabled ? 'Nonaktifkan Bel' : 'Aktifkan Bel'}
                </button>
                <button onClick={() => playSound({} as BellScheduleItem)} className="w-full py-3 px-4 rounded-lg font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all">
                  <Volume2 className="mr-2"/>
                  Test Suara
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-600">Jadwal Bel</h2>
              <button onClick={() => setEditingItem({ time: '', label: '', sound: 'bell', type: 'sound', days: settings.daysActive })} className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-600">
                <Plus size={16}/> Tambah Jadwal
              </button>
            </div>
            <div className="overflow-x-auto">
              {schedule.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Jadwal belum diatur.</p>
              ) : (
                <table className="w-full text-sm text-left"> 
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Label</th>
                      <th className="p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.sort((a,b) => a.time.localeCompare(b.time)).map(item => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono font-bold text-blue-600">{item.time}</td>
                        <td className="p-3">{item.label}</td>
                        <td className="p-3 flex items-center gap-2">
                          <button onClick={() => setEditingItem(item)} className="text-gray-400 hover:text-blue-500"><Settings size={16}/></button>
                          <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold mb-4">Edit Jadwal</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-500">Waktu (HH:MM)</label>
                <input type="time" value={editingItem.time} onChange={e => setEditingItem({...editingItem, time: e.target.value})} className="w-full p-2 border rounded-lg mt-1" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">Label</label>
                <input type="text" value={editingItem.label} onChange={e => setEditingItem({...editingItem, label: e.target.value})} className="w-full p-2 border rounded-lg mt-1" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setEditingItem(null)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 flex items-center gap-2"><X size={16}/> Batal</button>
                <button onClick={handleSaveItem} className="px-4 py-2 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 flex items-center gap-2"><Save size={16}/> Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolBell;

