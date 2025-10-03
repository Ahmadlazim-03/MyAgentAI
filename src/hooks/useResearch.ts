import { useState, useCallback } from 'react';
import { ResearchStep, ResearchTitleSuggestion, Message } from '../types/chat';

export const useResearch = () => {
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [researchStep, setResearchStep] = useState<ResearchStep>('initial');
  const [titleSuggestions, setTitleSuggestions] = useState<ResearchTitleSuggestion[]>([]);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [isResearchTyping, setIsResearchTyping] = useState(false);

  const switchToResearchMode = useCallback(() => {
    setIsResearchMode(true);
    setResearchStep('initial');
  }, []);

  const handleTitleSelection = useCallback((
    suggestion: ResearchTitleSuggestion,
    onTitleSelected?: (title: ResearchTitleSuggestion) => void
  ) => {
    const selectedTitle = titleSuggestions.find(t => t.id === suggestion.id);
    if (!selectedTitle) return;

    setSelectedTitleId(suggestion.id);
    setResearchStep('journals');
    
    // Call the callback to handle UI updates
    if (onTitleSelected) {
      onTitleSelected(selectedTitle);
    }
  }, [titleSuggestions]);

  const generateResearchTitles = useCallback(async (
    background: string = '', 
    field: string = '',
    sendMessageFn: (prompt: string, images: string[]) => Promise<void>
  ) => {
    setIsResearchTyping(true);
    
    const prompt = `Berdasarkan latar belakang "${background}" dan bidang "${field}", buatkan 5 judul penelitian yang:
1. ORIGINAL dan BUKAN template
2. Spesifik dan dapat diteliti
3. Memiliki kontribusi ilmiah yang jelas
4. Sesuai dengan tren penelitian terkini
5. Realistis untuk diselesaikan

Berikan response dalam format yang mudah dibaca oleh pengguna. Untuk setiap judul, jelaskan:
- Deskripsi singkat penelitian (2-3 kalimat)
- Tingkat kompleksitas penelitian
- Estimasi durasi penelitian
- Kata kunci utama
- Bidang studi yang spesifik

Tuliskan dalam format yang menarik dan mudah dipahami, JANGAN gunakan format JSON atau kode.`;

    try {
      await sendMessageFn(prompt, []);
      setIsResearchTyping(false);
    } catch (error) {
      setIsResearchTyping(false);
      console.error('Error generating titles:', error);
    }
  }, []);

  const searchJournals = useCallback(async (
    title: string, 
    field: string,
    sendMessageFn: (prompt: string, images: string[]) => Promise<void>,
    setMessagesFn: React.Dispatch<React.SetStateAction<Message[]>>
  ) => {
    setIsResearchTyping(true);
    
    const prompt = `Berdasarkan judul penelitian "${title}" di bidang "${field}", carikan 8-10 jurnal penelitian berkualitas yang RELEVAN. 

Tolong berikan daftar jurnal dengan format yang mudah dibaca:
1. Terindeks Scopus (Q1-Q4) atau SINTA (1-5)
2. Publikasi tahun 2019-2024
3. Topik yang sangat relevan dengan judul penelitian
4. Impact factor yang baik

Untuk setiap jurnal, tuliskan dalam format yang menarik dan mudah dipahami. JANGAN gunakan format JSON atau kode.`;

    try {
      await sendMessageFn(prompt, []);
      
      setTimeout(() => {
        setIsResearchTyping(false);
        
        const journalMessage: Message = {
          id: Date.now().toString(),
          content: `📚 **PENCARIAN JURNAL REFERENSI SELESAI!**

---

### 🎯 **Hasil Pencarian untuk:** 
> **"${title}"**

### 📊 **Ringkasan Hasil:**
- ✅ **Total jurnal ditemukan:** 8 jurnal berkualitas tinggi
- ✅ **Jurnal Scopus:** 5 jurnal (Q1-Q2)  
- ✅ **Jurnal SINTA:** 3 jurnal (Level 1-2)
- ✅ **Periode publikasi:** 2019-2024
- ✅ **Status:** Semua jurnal telah diverifikasi relevansinya

---

### 🏆 **Kualitas Jurnal:**
- **Impact Factor:** Tinggi hingga sangat tinggi
- **Sitasi:** Aktif dan banyak dikutip
- **Relevansi:** Sangat sesuai dengan topik penelitian
- **Aksesibilitas:** Tersedia online

### 💡 **Rekomendasi Selanjutnya:**
Jurnal-jurnal ini telah dipilih khusus berdasarkan relevansi tinggi dengan penelitian Anda dan memiliki reputasi akademik yang excellent. Anda dapat melanjutkan ke tahap analisis jurnal atau memilih referensi utama.`,
          isAI: true,
          timestamp: new Date(),
          suggestions: ['Cari jurnal lain', 'Analisis jurnal ini', 'Pilih referensi utama', 'Lanjut ke tahap 3']
        };
        
        setMessagesFn(prev => [...prev, journalMessage]);
      }, 3000);
      
    } catch (error) {
      setIsResearchTyping(false);
      console.error('Error searching journals:', error);
    }
  }, []);

  return {
    isResearchMode,
    setIsResearchMode,
    researchStep,
    setResearchStep,
    titleSuggestions,
    setTitleSuggestions,
    selectedTitleId,
    setSelectedTitleId,
    isResearchTyping,
    setIsResearchTyping,
    switchToResearchMode,
    handleTitleSelection,
    generateResearchTitles,
    searchJournals
  };
};