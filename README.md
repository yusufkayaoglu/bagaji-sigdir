# Bagajı Sığdır!

## Adım 3: beş eşya ve flamingo etkileşimi

Kırmızı, sarı ve mor bavulu, plaj topunu ve flamingoyu bagaja sürükleyin. Eşyalar farklı sıralarda yerleştirilebilir; bagaj içinde ayrılmış, birbiriyle çakışmayan bölgelere otururlar. Bagaj dışına bırakılan eşya yerine döner.

Flamingo şişikken kabul edilmez. HAVASINI İNDİR düğmesiyle sönme animasyonunu oynatın, ardından küçülen flamingoyu sürükleyin. Beş eşya tamamlanınca 5/5, başarı mesajı ve kutlama efekti görünür. Yeniden dene, flamingonun şişkin hali dahil tüm durumu sıfırlar.

Fare, dokunma ve klavye desteklenir. Tab ile eşya seçip Enter veya Boşluk ile yerleştirin. Hareket azaltma tercihi desteklenir.

- Kurulum: npm install
- Geliştirme: npm run dev (http://127.0.0.1:5174)
- Derleme: npm run build
- Test: npm test (Edge kurulu olmalı; görünmez tarayıcı)

Bu aşama yerleştirme etkileşimidir. Bagaj kapanışı, araç hareketi, reklam ağı entegrasyonu ve mağaza bağlantısı henüz uygulanmamıştır. Hedef reklam ağına göre görsel boyut optimizasyonu ayrıca yapılacaktır.

Görseller yerleşik Imagegen aracıyla üretilmiş, public/assets altına kaydedilmiştir. Üretim istemleri ASSET-PROMPTS.txt ve ASSET-PROMPTS-v2.json dosyalarındadır. scene-v2 boş sahne, ayrı PNG dosyaları alfa kanallı eşya görselleridir. Eski görseller korunmuştur.

## Görsel optimizasyonu

Çalışan oyunun görselleri src/assets içindeki WebP dosyalarıdır. Yedi görsel toplam 186.808 bayttır (önce 10.426.337 bayt PNG). Arka plan 720 piksel genişliğe, sprite görselleri ekrandaki boyutlarına uygun çözünürlüğe indirilmiştir; alfa kanalları korunur. Arka plan HTML üzerinden ön yüklenir. Vite içerik hashleriyle dosyaları paketler. publicDir kapalı olduğu için public/assets içindeki yüksek çözünürlüklü kaynak PNG dosyaları yayına kopyalanmaz.

Kaynaklardan yeniden üretim: npm run optimize:assets
Doğrulama: npm test ve npm run build

## Kod yapısı

- src/main.js: uygulama başlangıcı ve geliştirme sırasında temiz kapanış.
- src/game/GameController.js: yükleme, yerleştirme, sönme, tamamlanma ve sıfırlama akışı.
- src/game/data/items.js: eşya görselleri, başlangıç konumları, bagaj yuvaları ve sönmüş flamingo boyutları.
- src/game/input/DragController.js: fare/dokunma/klavye, pointer capture ve iptal yönetimi. Ekran ölçümü hareket başlangıcında yapılır; stil yazımları requestAnimationFrame ile birleştirilir.
- src/game/ui/createView.js: ekran üretimi, önbelleklenmiş DOM referansları, eşya çizimi ve ilerleme göstergesi.
- src/game/effects/animations.js: geri dönüş, yerleşme, sönme ve kutlama animasyonları.
- src/game/geometry.js: koordinat dönüşümü ve bagaj alanı denetimi.
- src/styles/: temel yerleşim, eşyalar, arayüz ve animasyon stilleri.

Oyun kapanışında olay dinleyicileri, bekleyen çizim ve animasyonlar temizlenir. Sıfırlama öncesi animasyonların eski durumu geri yazması engellenir. Kullanılmayan Phaser bağımlılığı kaldırılmıştır; çalışma zamanı ek kütüphane gerektirmez.

npm run format kodu biçimlendirir; npm run format:check biçimlendirmeyi kontrol eder. GitHub Actions derlemeden sonra Chromium üzerinde etkileşim testlerini çalıştırır; kontroller geçmeden Pages dağıtımı yapılmaz. Yerel testler Windows üzerinde Edge kullanır.
