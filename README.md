# Toptan Sipariş Sistemi

Ambalaj/temizlik ürünleri toptan satışı için: her müşterinize özel bir link verirsiniz,
onlar o linkten ürünleri ve kendi özel fiyatlarını görüp sipariş verir. Siz "Sipariş
Kayıtları" panelinden kimin ne zaman ne kadarlık sipariş verdiğini görürsünüz.

Hiçbir harici pakete ihtiyaç duymaz (sadece Node.js gerekir), bu yüzden kurulumu çok basittir.

## 1) Bilgisayarınızda deneme
```
node server.js
```
Sonra tarayıcıda `http://localhost:3000/?admin=ERGUNAMBALAJ` açın (ilk giriş şifresi: `12345`,
`data.json` dosyasından değiştirebilirsiniz).

## 2) Gerçek kullanıma almak (ücretsiz/ucuz seçenekler)
Bu tür küçük bir Node.js uygulaması için en kolay ve genelde ücretsiz başlangıç seçenekleri:

- **Render.com** (önerilen, en kolayı): "New Web Service" → bu klasörü GitHub'a yükleyip
  bağlayın → Build command boş, Start command: `node server.js` → deploy edin. Render
  size otomatik bir `https://sizin-uygulamaniz.onrender.com` linki verir, bunu kendi
  alan adınıza (örn. siparis.firmaniz.com) da bağlayabilirsiniz.
- **Railway.app** — benzer şekilde tek tıkla Node.js uygulaması barındırır.

⚠️ Önemli: Bu ücretsiz servislerin çoğunda dosya sistemi *kalıcı olmayabilir*
(uygulama yeniden başladığında `data.json` sıfırlanabilir). Gerçek/kalıcı kullanım için:
  - Render'da "Persistent Disk" ekleyin (ücretli plana geçmeniz gerekebilir), veya
  - `data.json` yerine gerçek bir veritabanına (örn. ücretsiz PostgreSQL - Supabase/Neon)
    geçilmesi önerilir. İsterseniz bu adımı da birlikte yapabiliriz.

## 3) Güvenlik notları (canlıya almadan önce mutlaka bakın)
- `data.json` içindeki `adminPassword` değerini güçlü bir şifreyle değiştirin.
- Şifre şu an düz metin olarak kontrol ediliyor; ciddi/uzun vadeli kullanım için
  gerçek bir oturum/şifreleme sistemi eklenmesi önerilir.
- Müşteri linkleri tahmin edilemeyecek rastgele kodlar içerir, ama yine de linki
  yalnızca ilgili müşteriyle paylaşın.

## Dosya yapısı
- `server.js` — sunucu ve tüm API uç noktaları
- `public/index.html` — müşteri ve yönetici arayüzü (tek dosya)
- `data.json` — ürünler, müşteriler ve siparişlerin tutulduğu yer (ilk çalıştırmada otomatik oluşur)
