# Stock Metadata Generator — Yol Haritası

Bu doküman, mevcut `web/` (React + TypeScript + Vite) uygulamasının incelenmesi ve
sizinle yapılan görüşme sonucunda ortaya çıkan gereksinimlerin tam listesidir.

## 1. Mevcut Mimari — Tespit Edilen Sorun

- `App.tsx` tek dosyada **1405 satır**: state yönetimi, tüm bileşenler (Toolbar,
  FileList, Sidebar, KeywordTabs, SettingsModal, IStockModal), yardımcı
  fonksiyonlar ve tip tanımları iç içe.
- Yeni özellikleri düzgün eklemek ve sürdürülebilir kalmak için bu dosyanın
  mantıklı modüllere/component dosyalarına ayrılması gerekiyor.
- **Karar:** Kod mimarisi düzenlemesi ile UI yenilemesi **birlikte**
  yapılacak (yeni özellikler zaten refactor'ü zorunlu kılıyor).

## 2. Görünüm (UI/UX)

- Genel tasarım yenilenecek: **Apple ekosistemine yakın, sade ve profesyonel**
  bir görünüm (temiz tipografi, gereksiz görsel gürültü yok).
- Gereksiz yer kaplayan butonlar sadeleştirilecek.
- Metin alanlarının (açıklama vb.) okunabilirliği artırılacak (kontrast,
  satır yüksekliği, alan boyutu).
- Başlık alanına **canlı/renkli karakter sayacı** eklenecek (150–200 hedefi
  görsel olarak takip edilebilsin).

## 3. Korunacak Mevcut Davranışlar (Regresyon Riski — Bozulmamalı)

- Sadece `.jpg/.jpeg/.mov/.mp4` dosyaları listeye alınıyor, harici dosya
  filtreleniyor — **bu davranış korunacak**.
- Küçük önizleme (thumbnail) sistemi çalışıyor — **korunacak**.
- Üretilen metadata dosya kimliğine (`ad+boyut+değiştirilme tarihi`) göre
  `localStorage`'da saklanıyor; aynı klasör tekrar seçildiğinde geri geliyor
  — **korunacak**.
- İngilizce alanlarda tek tuşla kopyalama — **korunacak**, Türkçe alanlarda
  kopyalamaya gerek yok (sadece kontrol amaçlı).

## 4. Kaldırılacak

- **CSV export özelliği kaldırılacak.** Kullanım şekli "kopyala/yapıştır"
  üzerinden ilerliyor, CSV'ye ihtiyaç yok.

## 5. Üretim Süreci (Metadata Pipeline)

- Fotoğraf belirli bir boyuta getirilip Groq (vision) ile analiz ediliyor.
- **Video için düzeltme (bug fix):** Şu an kare, videonun **başından**
  (`currentTime = 0.1`) alınıyor. **Videonun ortasından** kare alınacak
  şekilde düzeltilecek.
- **Başlık:** 150–200 karakter aralığında (alt sınırın altına düşmemeli).
- **Açıklama:** daha detaylı ve uzun, başlığı tekrar etmemeli.
- **Anahtar kelimeler:** Everypixels'ten üretiliyor, değer sırasına göre
  (en değerli en başta) sıralı olmalı. Limitler kesin: **Adobe 49,
  Shutterstock 50, iStock 50**. Everypixels limiti dolduramazsa Groq ile
  tamamlanacak (mevcut `fillKeywordsToMax` mantığı gözden geçirilip
  güvenilir hale getirilecek).
- Her üretilen alan (başlık/açıklama/keywords) için Türkçe karşılığı da
  üretiliyor (kontrol amaçlı, düzenlenebilir ama kopyalanmıyor).

## 6. Referans Bilgi Alanı (Hint)

- Şu an global/tek bir "ipucu" kutusu var; bu, prompt'lara zaten ekleniyor
  ama dosyalar arası paylaşılıyor.
- **Yeni davranış:** Referans bilgi **dosya bazlı** olacak, tek görsel
  odaklı çalışacak. Bir görsel için metadata üretildikten sonra bir
  sonraki görsele geçildiğinde **alan otomatik temizlenecek**.

## 7. iStock Kütüphanesi

- Mevcut "Kütüphaneye Ekle / iStock Eşleştir" mekanizması tamamen manuel ve
  sıra (index) bazlı eşleştirmeye dayanıyor — kırılgan.
- **Yeni davranış:**
  - Kütüphanedeki eşleşmeler, keyword üretilir üretilmez **otomatik**
    arka planda uygulanacak (buton gerekmeyecek).
  - AI prompt'una iStock'a özel kurallar/talimatlar eklenecek (Getty
    kontrollü kelime dağarcığına daha yakın kelime üretimi için).
  - **Paylaşımlı kütüphane:** Uygulamayı kullanan birkaç kişi arasında
    ortak olacak. **Netlify Blobs + Netlify Functions** (ücretsiz katman)
    ile merkezi depolama kurulacak. Moderasyon yok — herkesin eklediği
    otomatik olarak ortak kütüphaneye yansıyacak.
  - Kütüphane için **JSON export/import** (yedekleme) eklenecek.

## 8. Groq Kota / Hız Sorunu

Tespit edilen kök neden: Bir görsel başına 3–5 ayrı sıralı Groq isteği
yapılıyor; ücretsiz katmanın düşük TPM limiti aşılınca 429 + uzun bekleme
(20–60 sn, 5 deneme) devreye giriyor. Toplu üretimde bu bekleme süreleri
üst üste binip hem yavaşlık hem "işe yaramama" hissi yaratıyor.

**Çözüm (üç yönlü):**

1. **İstek sayısını azalt** — görsel başına gereksiz ayrı çağrılar
   birleştirilecek (başlık+açıklama+keywords tek promptta, mevcut
   `apiMetadataWithKeywords` yolunu standart hale getirmek gibi).
2. **Akıllı hız sınırlama** — Groq'un rate-limit header'ları okunup, 429
   almadan önce istekler öngörülü olarak yavaşlatılacak.
3. **Çoklu API key + yedek sağlayıcı havuzu** — En az 4 Groq API key
   girilebilecek; biri limit dolunca otomatik sıradakine geçilecek. Ayrıca
   ücretsiz ikinci bir AI sağlayıcısı (ör. Gemini ücretsiz katmanı)
   yedek olarak eklenip Groq tamamen dolduğunda devreye girecek.
4. **Türkçe çeviriler geç gelebilir** — öncelik İngilizce alanlarda,
   Türkçe arka planda/sonradan tamamlanabilir.

Ek olarak:
- **Zaten üretilmiş dosyayı atla uyarısı** — toplu üretimde, metadata'sı
  olan dosyalar işaretlenip gereksiz yeniden üretim (ve kota israfı)
  önlenecek.
- **Kısmi yeniden üretim** — "sadece başlığı/açıklamayı yenile" veya
  "sadece keywords'ü yenile" seçenekleri eklenecek.

## 9. API Ayarları

- Ayarlar ekranı daha belirgin/görünür hale getirilecek.
- Birden fazla Groq API key girişi (rotasyon + limit dolunca otomatik
  geçiş) burada yönetilecek.

## 10. Hata Mesajları

- Şu an bazı hatalar ham API yanıtını (status kodu + teknik metin) direkt
  gösteriyor. Bunun yerine anlamlı, Türkçe, kullanıcı dostu mesajlar
  gösterilecek (ör. "API limitiniz doldu", "Bağlantı zaman aşımına
  uğradı", "API key hatalı görünüyor").

## 11. Verimlilik / Hız (Genel)

- Klavye kısayolları eklenecek (sonraki/önceki dosya, üret gibi sık
  kullanılan aksiyonlar için).

---

## Uygulama Sırası (Önerilen)

1. Proje yapısını modüllere ayırma (mimari temizlik) — diğer tüm
   maddelerin üzerine sağlıklı inşa edebilmek için önce bu.
2. Groq istek optimizasyonu + çoklu key/sağlayıcı rotasyonu + hata
   mesajları (en çok şikayet edilen, en somut fayda sağlayacak kısım).
3. Video orta kare düzeltmesi (küçük ama kesin bug fix).
4. Referans bilgi alanının dosya bazlı hale getirilmesi.
5. iStock otomatik kütüphane eşleştirme + AI prompt kuralları.
6. UI yenileme (Apple tarzı tasarım + karakter sayacı + sadeleştirme).
7. Paylaşımlı iStock kütüphanesi (Netlify Blobs) + export/import.
8. CSV kaldırma, klavye kısayolları, "zaten üretilmiş" uyarısı, kısmi
   yeniden üretim gibi ince ayarlar.
