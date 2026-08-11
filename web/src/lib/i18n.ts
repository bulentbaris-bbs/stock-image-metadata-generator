import { SECONDARY_LANGUAGES } from './languages';

/** UI language codes — same set as the secondary content language. */
export type UILang = 'en' | 'tr' | 'de' | 'es' | 'fr' | 'ru' | 'zh';

type Dict = Record<UILang, string>;

/** All translatable UI strings. Turkish is the reference/original copy. */
const STRINGS: Record<string, Dict> = {
  search_placeholder: {
    en: 'Search files...', tr: 'Dosya ara...', de: 'Datei suchen...', es: 'Buscar archivo...', fr: 'Rechercher un fichier...', ru: 'Поиск файла...', zh: '搜索文件...',
  },
  folder_select_title: {
    en: 'Select file / folder', tr: 'Dosya / klasör seç', de: 'Datei / Ordner auswählen', es: 'Seleccionar archivo / carpeta', fr: 'Sélectionner fichier / dossier', ru: 'Выбрать файл / папку', zh: '选择文件/文件夹',
  },
  collapse_toggle_title: {
    en: 'Collapse / expand menu', tr: 'Menüyü daralt / genişlet', de: 'Menü ein-/ausklappen', es: 'Contraer / expandir menú', fr: 'Réduire / développer le menu', ru: 'Свернуть / развернуть меню', zh: '折叠/展开菜单',
  },
  hint_placeholder: {
    en: 'Add reference note',
    tr: 'Referans bilgi ekle',
    de: 'Referenzinfo hinzufügen',
    es: 'Añadir información de referencia',
    fr: 'Ajouter une information de référence',
    ru: 'Добавить справочную информацию',
    zh: '添加参考信息',
  },
  refresh_title_btn: {
    en: 'Refresh title only', tr: 'Sadece başlığı yenile', de: 'Nur Titel aktualisieren', es: 'Actualizar solo el título', fr: 'Actualiser uniquement le titre', ru: 'Обновить только заголовок', zh: '仅刷新标题',
  },
  refreshing: {
    en: 'Refreshing…', tr: 'Yenileniyor…', de: 'Wird aktualisiert…', es: 'Actualizando…', fr: 'Actualisation…', ru: 'Обновление…', zh: '正在刷新…',
  },
  generate_btn: {
    en: 'Generate', tr: 'Üret', de: 'Generieren', es: 'Generar', fr: 'Générer', ru: 'Создать', zh: '生成',
  },
  generating: {
    en: 'Generating…', tr: 'Üretiliyor…', de: 'Wird generiert…', es: 'Generando…', fr: 'Génération…', ru: 'Создание…', zh: '正在生成…',
  },
  istock_library_title: {
    en: 'iStock library', tr: 'iStock kütüphanesi', de: 'iStock-Bibliothek', es: 'Biblioteca de iStock', fr: 'Bibliothèque iStock', ru: 'Библиотека iStock', zh: 'iStock 词库',
  },
  theme_toggle_to_dark_title: {
    en: 'Switch to dark mode', tr: 'Karanlık moda geç', de: 'Zum Dunkelmodus wechseln', es: 'Cambiar a modo oscuro', fr: 'Passer en mode sombre', ru: 'Включить тёмный режим', zh: '切换到深色模式',
  },
  theme_toggle_to_light_title: {
    en: 'Switch to light mode', tr: 'Aydınlık moda geç', de: 'Zum Hellmodus wechseln', es: 'Cambiar a modo claro', fr: 'Passer en mode clair', ru: 'Включить светлый режим', zh: '切换到浅色模式',
  },
  lang_select_title: {
    en: 'Translation language', tr: 'İkincil çeviri dili', de: 'Zweite Ausgabesprache', es: 'Idioma secundario', fr: 'Langue secondaire', ru: 'Второй язык', zh: '第二输出语言',
  },
  groq_status_title: {
    en: 'Groq · {active}/{max} keys active', tr: 'Groq · anahtar {active}/{max} aktif', de: 'Groq · {active}/{max} Keys aktiv', es: 'Groq · {active}/{max} claves activas', fr: 'Groq · {active}/{max} clés actives', ru: 'Groq · {active}/{max} ключей активно', zh: 'Groq · {active}/{max} 个密钥已启用',
  },
  openrouter_active_suffix: {
    en: ' · OpenRouter fallback active', tr: ' · OpenRouter yedek aktif', de: ' · OpenRouter-Fallback aktiv', es: ' · Respaldo OpenRouter activo', fr: ' · Secours OpenRouter actif', ru: ' · Резерв OpenRouter активен', zh: ' · OpenRouter 备用已启用',
  },
  files_count: {
    en: '{n} files', tr: '{n} dosya', de: '{n} Dateien', es: '{n} archivos', fr: '{n} fichiers', ru: '{n} файлов', zh: '{n} 个文件',
  },
  files_done: {
    en: '{n} completed', tr: '{n} tamamlandı', de: '{n} fertig', es: '{n} completados', fr: '{n} terminés', ru: '{n} готово', zh: '{n} 已完成',
  },
  files_selected: {
    en: '{n} selected', tr: '{n} seçili', de: '{n} ausgewählt', es: '{n} seleccionados', fr: '{n} sélectionnés', ru: '{n} выбрано', zh: '已选择 {n}',
  },
  dropzone_text: {
    en: 'Drag images/videos or use the button above',
    tr: 'Görsel/video sürükleyin ya da yukarıdaki butonu kullanın',
    de: 'Bild/Video hierher ziehen oder die Schaltfläche oben verwenden',
    es: 'Arrastra una imagen/video o usa el botón de arriba',
    fr: "Glissez une image/vidéo ou utilisez le bouton ci-dessus",
    ru: 'Перетащите изображение/видео или используйте кнопку выше',
    zh: '拖放图片/视频，或使用上方按钮',
  },
  ring_warn_title: {
    en: 'Keyword limit not reached on some platforms',
    tr: 'Bazı platformlarda anahtar kelime limiti dolmadı',
    de: 'Bei manchen Plattformen ist das Keyword-Limit nicht erreicht',
    es: 'El límite de palabras clave no se alcanzó en algunas plataformas',
    fr: "La limite de mots-clés n'est pas atteinte sur certaines plateformes",
    ru: 'На некоторых платформах лимит ключевых слов не заполнен',
    zh: '部分平台的关键词数量未达上限',
  },
  coffee_btn: {
    en: 'Buy me a coffee', tr: 'Kahve ısmarla', de: 'Einen Kaffee spendieren', es: 'Invitar un café', fr: 'Offrir un café', ru: 'Угостить кофе', zh: '请我喝杯咖啡',
  },
  coffee_title: {
    en: 'If you like this app, you can buy me a coffee',
    tr: 'Bu uygulamayı beğendiyseniz bir kahve ısmarlayabilirsiniz',
    de: 'Wenn dir die App gefällt, kannst du mir einen Kaffee spendieren',
    es: 'Si te gusta esta app, puedes invitarme un café',
    fr: 'Si vous aimez cette application, vous pouvez m’offrir un café',
    ru: 'Если приложение понравилось, можете угостить меня кофе',
    zh: '如果您喜欢这个应用，可以请我喝杯咖啡',
  },
  batch_select_add: {
    en: 'Select for batch processing', tr: 'Toplu işleme için seç', de: 'Für Stapelverarbeitung auswählen', es: 'Seleccionar para lote', fr: 'Sélectionner pour le lot', ru: 'Выбрать для пакетной обработки', zh: '选择以批量处理',
  },
  batch_select_remove: {
    en: 'Remove selection', tr: 'Seçimi kaldır', de: 'Auswahl aufheben', es: 'Quitar selección', fr: 'Retirer la sélection', ru: 'Снять выбор', zh: '取消选择',
  },
  frame_pick_title: {
    en: 'Choose analysis frame', tr: 'Analiz karesini seç', de: 'Analyse-Frame wählen', es: 'Elegir fotograma de análisis', fr: "Choisir l'image d'analyse", ru: 'Выбрать кадр для анализа', zh: '选择分析帧',
  },
  frame_pick_hint: {
    en: 'Choose a frame (or double-click the thumbnail)',
    tr: 'Kare seç (küçük resme çift tıklayarak da açabilirsiniz)',
    de: 'Frame wählen (auch per Doppelklick auf das Vorschaubild)',
    es: 'Elegir fotograma (o haz doble clic en la miniatura)',
    fr: "Choisir l'image (ou double-cliquez sur la miniature)",
    ru: 'Выбрать кадр (или дважды щёлкните по миниатюре)',
    zh: '选择帧（也可双击缩略图打开）',
  },
  frame_pick_overlay_label: {
    en: '▶ Pick frame', tr: '▶ Kare seç', de: '▶ Frame wählen', es: '▶ Elegir fotograma', fr: "▶ Choisir l'image", ru: '▶ Выбрать кадр', zh: '▶ 选择帧',
  },
  frame_pick_selected_title: {
    en: 'Frame selected — click to change (or double-click the thumbnail)',
    tr: 'Kare seçildi — değiştirmek için tıklayın (veya küçük resme çift tıklayın)',
    de: 'Frame gewählt — zum Ändern klicken (oder Vorschaubild doppelklicken)',
    es: 'Fotograma elegido — clic para cambiar (o doble clic en la miniatura)',
    fr: "Image choisie — cliquez pour changer (ou double-cliquez sur la miniature)",
    ru: 'Кадр выбран — нажмите, чтобы изменить (или дважды щёлкните по миниатюре)',
    zh: '已选帧——点击可更改（或双击缩略图）',
  },
  field_title: {
    en: 'Title', tr: 'Başlık', de: 'Titel', es: 'Título', fr: 'Titre', ru: 'Заголовок', zh: '标题',
  },
  field_description: {
    en: 'Description', tr: 'Açıklama', de: 'Beschreibung', es: 'Descripción', fr: 'Description', ru: 'Описание', zh: '描述',
  },
  copy_action: {
    en: 'Copy', tr: 'Kopyala', de: 'Kopieren', es: 'Copiar', fr: 'Copier', ru: 'Копировать', zh: '复制',
  },
  char_count: {
    en: '{n} characters', tr: '{n} karakter', de: '{n} Zeichen', es: '{n} caracteres', fr: '{n} caractères', ru: '{n} символов', zh: '{n} 个字符',
  },
  keyword_search_placeholder: {
    en: 'Search keywords (EN)...', tr: 'Anahtar kelime ara (EN/TR)...', de: 'Keyword suchen (EN/DE)...', es: 'Buscar palabra clave (EN/ES)...', fr: 'Rechercher un mot-clé (EN/FR)...', ru: 'Поиск ключевого слова (EN/RU)...', zh: '搜索关键词 (EN/中文)...',
  },
  copy_all_action: {
    en: 'Copy all', tr: 'Tümünü kopyala', de: 'Alles kopieren', es: 'Copiar todo', fr: 'Tout copier', ru: 'Копировать всё', zh: '复制全部',
  },
  missing_keywords: {
    en: '{n} words missing', tr: '{n} kelime eksik', de: '{n} Wörter fehlen', es: 'Faltan {n} palabras', fr: '{n} mots manquants', ru: 'Не хватает {n} слов', zh: '还缺 {n} 个关键词',
  },
  no_filter_match: {
    en: 'No keywords match the filter.', tr: 'Filtreyle eşleşen anahtar kelime yok.', de: 'Keine Keywords passen zum Filter.', es: 'Ninguna palabra clave coincide con el filtro.', fr: 'Aucun mot-clé ne correspond au filtre.', ru: 'Нет ключевых слов, соответствующих фильтру.', zh: '没有匹配筛选条件的关键词。',
  },
  remove_kw_aria: {
    en: 'Remove', tr: 'Kaldır', de: 'Entfernen', es: 'Quitar', fr: 'Retirer', ru: 'Удалить', zh: '移除',
  },
  update_lang_btn: {
    en: 'Update', tr: 'Güncelle', de: 'Aktualisieren', es: 'Actualizar', fr: 'Mettre à jour', ru: 'Обновить', zh: '更新',
  },
  add_keyword_placeholder: {
    en: 'Add word...', tr: 'Kelime ekle...', de: 'Wort hinzufügen...', es: 'Añadir palabra...', fr: 'Ajouter un mot...', ru: 'Добавить слово...', zh: '添加词语...',
  },
  istock_add_to_library_btn: {
    en: 'Add to library', tr: 'Kütüphaneye ekle', de: 'Zur Bibliothek hinzufügen', es: 'Añadir a la biblioteca', fr: 'Ajouter à la bibliothèque', ru: 'Добавить в библиотеку', zh: '添加到词库',
  },
  istock_add_to_library_title: {
    en: 'Adds all iStock keywords you manually corrected in this file (original → corrected) to the shared iStock library at once',
    tr: 'Bu dosyada elle düzelttiğiniz iStock anahtar kelimelerinin tümünü (orijinal → düzeltilmiş) tek seferde paylaşılan iStock kütüphanesine ekler',
    de: 'Fügt alle in dieser Datei manuell korrigierten iStock-Keywords (Original → korrigiert) auf einmal zur gemeinsamen iStock-Bibliothek hinzu',
    es: 'Añade de una vez todas las palabras clave de iStock que has corregido manualmente en este archivo (original → corregida) a la biblioteca compartida de iStock',
    fr: 'Ajoute en une seule fois tous les mots-clés iStock corrigés manuellement dans ce fichier (original → corrigé) à la bibliothèque iStock partagée',
    ru: 'Добавляет за один раз все вручную исправленные в этом файле ключевые слова iStock (оригинал → исправлено) в общую библиотеку iStock',
    zh: '将此文件中手动更正过的所有 iStock 关键词（原始→更正后）一次性添加到共享的 iStock 词库',
  },
  istock_added_count: {
    en: '{n} added', tr: '{n} eklendi', de: '{n} hinzugefügt', es: '{n} añadidas', fr: '{n} ajoutés', ru: 'Добавлено: {n}', zh: '已添加 {n} 个',
  },
  istock_added_none: {
    en: 'No corrections', tr: 'Düzeltme yok', de: 'Keine Korrekturen', es: 'Sin correcciones', fr: 'Aucune correction', ru: 'Нет исправлений', zh: '无更正',
  },
  istock_syncing: {
    en: 'Syncing shared library…',
    tr: 'Paylaşımlı kütüphane senkronize ediliyor…',
    de: 'Gemeinsame Bibliothek wird synchronisiert…',
    es: 'Sincronizando biblioteca compartida…',
    fr: 'Synchronisation de la bibliothèque partagée…',
    ru: 'Синхронизация общей библиотеки…',
    zh: '正在同步共享词库…',
  },
  istock_shared_note: {
    en: 'Mappings you add here are shared publicly with everyone using the app.',
    tr: 'Buraya eklediğiniz eşlemeler, uygulamayı kullanan herkese açık olarak paylaşılır.',
    de: 'Die hier hinzugefügten Zuordnungen werden öffentlich mit allen Nutzern der App geteilt.',
    es: 'Las asignaciones que añadas aquí se comparten públicamente con todos los usuarios de la app.',
    fr: "Les correspondances que vous ajoutez ici sont partagées publiquement avec tous les utilisateurs de l'application.",
    ru: 'Добавленные здесь сопоставления публично доступны всем пользователям приложения.',
    zh: '您在此添加的映射将公开共享给使用此应用的所有人。',
  },
  update_lang_title: {
    en: 'Re-translate the title, description and keywords into {lang} based on the English text',
    tr: "Başlık, açıklama ve anahtar kelimelerin {lang} karşılıklarını İngilizce metne göre yeniden çevir",
    de: 'Titel, Beschreibung und Keywords auf {lang} anhand des englischen Texts neu übersetzen',
    es: 'Volver a traducir el título, la descripción y las palabras clave al {lang} según el texto en inglés',
    fr: "Retraduire le titre, la description et les mots-clés en {lang} à partir du texte anglais",
    ru: 'Заново перевести заголовок, описание и ключевые слова на {lang} по английскому тексту',
    zh: '根据英文内容重新将标题、描述和关键词翻译为{lang}',
  },
  update_lang_error: {
    en: 'Could not update {lang}', tr: '{lang} güncellenemedi', de: '{lang} konnte nicht aktualisiert werden', es: 'No se pudo actualizar {lang}', fr: "Impossible de mettre à jour {lang}", ru: 'Не удалось обновить {lang}', zh: '无法更新{lang}',
  },
  shortcut_nav: {
    en: 'navigate', tr: 'gezin', de: 'navigieren', es: 'navegar', fr: 'naviguer', ru: 'навигация', zh: '导航',
  },
  shortcut_go_to_fields: {
    en: 'go to fields', tr: 'alanlara geç', de: 'zu Feldern', es: 'ir a campos', fr: 'aller aux champs', ru: 'к полям', zh: '进入字段',
  },
  shortcut_in_tab: {
    en: 'in tab', tr: 'sekmede', de: 'im Tab', es: 'en pestaña', fr: "dans l'onglet", ru: 'на вкладке', zh: '在标签内',
  },
  shortcut_change_platform: {
    en: 'change platform', tr: 'platform değiştir', de: 'Plattform wechseln', es: 'cambiar plataforma', fr: 'changer de plateforme', ru: 'смена платформы', zh: '切换平台',
  },
  shortcut_copy: {
    en: 'copy', tr: 'kopyala', de: 'kopieren', es: 'copiar', fr: 'copier', ru: 'копировать', zh: '复制',
  },
  err_need_key: {
    en: 'Enter at least one Groq API key (or an OpenRouter fallback key) in Settings.',
    tr: "Ayarlar'dan en az bir Groq API key (veya OpenRouter yedek key) girin.",
    de: 'Geben Sie in den Einstellungen mindestens einen Groq-API-Key (oder OpenRouter-Ersatzschlüssel) ein.',
    es: 'Introduce al menos una clave API de Groq (o una clave de respaldo de OpenRouter) en Ajustes.',
    fr: "Saisissez au moins une clé API Groq (ou une clé de secours OpenRouter) dans les Paramètres.",
    ru: 'Введите хотя бы один API-ключ Groq (или резервный ключ OpenRouter) в настройках.',
    zh: '请在设置中至少输入一个 Groq API 密钥（或 OpenRouter 备用密钥）。',
  },
  err_meta_needs_groq: {
    en: 'At least one Groq API key is required to generate title and description. Add one in Settings.',
    tr: "Başlık ve açıklama üretimi için en az bir Groq API key gereklidir. Ayarlardan ekleyin.",
    de: 'Für die Titel- und Beschreibungserstellung ist mindestens ein Groq-API-Key erforderlich. Bitte in den Einstellungen hinzufügen.',
    es: 'Se requiere al menos una clave API de Groq para generar título y descripción. Añádela en Ajustes.',
    fr: "Au moins une clé API Groq est requise pour générer le titre et la description. Ajoutez-en une dans les Paramètres.",
    ru: 'Для генерации заголовка и описания требуется хотя бы один API-ключ Groq. Добавьте его в настройках.',
    zh: '生成标题和描述至少需要一个 Groq API 密钥。请在设置中添加。',
  },
  err_groq_only_rate_limited: {
    en: "Groq API limit reached. Please wait 30 seconds and try again. For faster generation, you can add another Groq key in Settings.",
    tr: "Groq API limiti doldu. Lütfen 30 saniye bekleyip tekrar deneyin. Daha hızlı üretim için Ayarlar'dan ek Groq key ekleyebilirsiniz.",
    de: 'Groq-API-Limit erreicht. Bitte warten Sie 30 Sekunden und versuchen Sie es erneut. Für schnellere Generierung können Sie in den Einstellungen einen weiteren Groq-Key hinzufügen.',
    es: 'Se alcanzó el límite de la API de Groq. Espera 30 segundos e inténtalo de nuevo. Para una generación más rápida, añade otra clave Groq en Ajustes.',
    fr: "Limite de l'API Groq atteinte. Patientez 30 secondes puis réessayez. Pour une génération plus rapide, ajoutez une autre clé Groq dans les Paramètres.",
    ru: 'Лимит API Groq исчерпан. Подождите 30 секунд и попробуйте снова. Для более быстрой генерации добавьте ещё один ключ Groq в настройках.',
    zh: '已达 Groq API 限额。请等待 30 秒后重试。如需更快生成，可在设置中添加更多 Groq 密钥。',
  },
  err_need_file: {
    en: 'Select at least one file, or click a file in the list.',
    tr: 'En az bir dosya seçin veya listeden bir dosyaya tıklayın.',
    de: 'Wählen Sie mindestens eine Datei aus oder klicken Sie auf eine Datei in der Liste.',
    es: 'Selecciona al menos un archivo o haz clic en uno de la lista.',
    fr: 'Sélectionnez au moins un fichier ou cliquez sur un fichier de la liste.',
    ru: 'Выберите хотя бы один файл или щёлкните файл в списке.',
    zh: '请至少选择一个文件，或点击列表中的文件。',
  },
  err_select_file_first: {
    en: 'Select a file first.', tr: 'Önce bir dosya seçin.', de: 'Wählen Sie zuerst eine Datei aus.', es: 'Primero selecciona un archivo.', fr: "Sélectionnez d'abord un fichier.", ru: 'Сначала выберите файл.', zh: '请先选择一个文件。',
  },
  err_everypixel_request_failed: {
    en: 'Everypixel request failed.', tr: 'Everypixel isteği başarısız oldu.', de: 'Everypixel-Anfrage fehlgeschlagen.', es: 'La solicitud a Everypixel falló.', fr: 'La requête Everypixel a échoué.', ru: 'Запрос к Everypixel не удался.', zh: 'Everypixel 请求失败。',
  },
  err_title_refresh_failed: {
    en: 'Could not refresh title.', tr: 'Başlık yenilenemedi.', de: 'Titel konnte nicht aktualisiert werden.', es: 'No se pudo actualizar el título.', fr: 'Impossible d’actualiser le titre.', ru: 'Не удалось обновить заголовок.', zh: '无法刷新标题。',
  },
  everypixel_warning: {
    en: 'Everypixel failed on {n} files, fell back to Groq (keywords were still generated). First error: {msg}',
    tr: "Everypixel {n} dosyada çalışmadı, Groq'a düşüldü (anahtar kelimeler yine üretildi). İlk hata: {msg}",
    de: 'Everypixel ist bei {n} Dateien fehlgeschlagen, Fallback auf Groq (Keywords wurden trotzdem erstellt). Erster Fehler: {msg}',
    es: 'Everypixel falló en {n} archivos, se usó Groq como alternativa (las palabras clave se generaron igualmente). Primer error: {msg}',
    fr: "Everypixel a échoué sur {n} fichiers, repli sur Groq (les mots-clés ont quand même été générés). Première erreur : {msg}",
    ru: 'Everypixel не сработал для {n} файлов, использован запасной Groq (ключевые слова всё равно созданы). Первая ошибка: {msg}',
    zh: 'Everypixel 在 {n} 个文件上失败，已回退至 Groq（关键词仍已生成）。首个错误：{msg}',
  },
  settings_title: {
    en: 'API Settings', tr: 'API Ayarları', de: 'API-Einstellungen', es: 'Ajustes de API', fr: 'Paramètres API', ru: 'Настройки API', zh: 'API 设置',
  },
  groq_keys_label: {
    en: 'Groq API Keys', tr: "Groq API Key'leri", de: 'Groq-API-Keys', es: 'Claves API de Groq', fr: 'Clés API Groq', ru: 'API-ключи Groq', zh: 'Groq API 密钥',
  },
  groq_keys_hint: {
    en: '(automatically switches to the next one when the limit is reached)',
    tr: '(limit dolunca otomatik sıradakine geçilir)',
    de: '(bei erreichtem Limit wird automatisch zum nächsten gewechselt)',
    es: '(al llegar al límite se pasa automáticamente al siguiente)',
    fr: "(passe automatiquement au suivant une fois la limite atteinte)",
    ru: '(при достижении лимита автоматически переключается на следующий)',
    zh: '（达到限额后自动切换到下一个）',
  },
  groq_key_placeholder: {
    en: 'Groq key {n}', tr: 'Groq key {n}', de: 'Groq-Key {n}', es: 'Clave Groq {n}', fr: 'Clé Groq {n}', ru: 'Ключ Groq {n}', zh: 'Groq 密钥 {n}',
  },
  optional_suffix: {
    en: '(optional)', tr: '(opsiyonel)', de: '(optional)', es: '(opcional)', fr: '(facultatif)', ru: '(необязательно)', zh: '（可选）',
  },
  openrouter_label: {
    en: 'OpenRouter API Key', tr: 'OpenRouter API Key', de: 'OpenRouter-API-Key', es: 'Clave API de OpenRouter', fr: 'Clé API OpenRouter', ru: 'API-ключ OpenRouter', zh: 'OpenRouter API 密钥',
  },
  openrouter_hint: {
    en: '(fallback)', tr: '(yedek)', de: '(Ersatz)', es: '(respaldo)', fr: '(secours)', ru: '(резерв)', zh: '（备用）',
  },
  openrouter_placeholder: {
    en: 'sk-or-... — used once all Groq keys are exhausted',
    tr: "sk-or-... — tüm Groq key'ler dolunca kullanılır",
    de: 'sk-or-... — wird verwendet, wenn alle Groq-Keys ausgeschöpft sind',
    es: 'sk-or-... — se usa cuando todas las claves Groq están agotadas',
    fr: "sk-or-... — utilisé quand toutes les clés Groq sont épuisées",
    ru: 'sk-or-... — используется, когда все ключи Groq исчерпаны',
    zh: 'sk-or-...——所有 Groq 密钥用尽后启用',
  },
  ep_id_label: {
    en: 'Everypixels Client ID', tr: 'Everypixels Client ID', de: 'Everypixels Client-ID', es: 'Everypixels Client ID', fr: 'Everypixels Client ID', ru: 'Everypixels Client ID', zh: 'Everypixels 客户端 ID',
  },
  ep_secret_label: {
    en: 'Everypixels Client Secret', tr: 'Everypixels Client Secret', de: 'Everypixels Client-Secret', es: 'Everypixels Client Secret', fr: 'Everypixels Client Secret', ru: 'Everypixels Client Secret', zh: 'Everypixels 客户端密钥',
  },
  ep_secret_placeholder: {
    en: '••••••••', tr: '••••••••', de: '••••••••', es: '••••••••', fr: '••••••••', ru: '••••••••', zh: '••••••••',
  },
  settings_group_meta_title: {
    en: 'Title & Description', tr: 'Başlık & Açıklama', de: 'Titel & Beschreibung', es: 'Título y descripción', fr: 'Titre et description', ru: 'Заголовок и описание', zh: '标题与描述',
  },
  settings_group_keywords_title: {
    en: 'Keywords', tr: 'Anahtar Kelimeler', de: 'Keywords', es: 'Palabras clave', fr: 'Mots-clés', ru: 'Ключевые слова', zh: '关键词',
  },
  groq_primary_key_label: {
    en: 'Groq primary key', tr: 'Groq asıl key', de: 'Groq-Hauptschlüssel', es: 'Clave Groq principal', fr: 'Clé Groq principale', ru: 'Основной ключ Groq', zh: 'Groq 主密钥',
  },
  groq_fallback_key_label: {
    en: 'Groq fallback key', tr: 'Groq yedek key', de: 'Groq-Ersatzschlüssel', es: 'Clave Groq de respaldo', fr: 'Clé Groq de secours', ru: 'Резервный ключ Groq', zh: 'Groq 备用密钥',
  },
  groq_primary_key_placeholder: {
    en: 'Groq key', tr: 'Groq key', de: 'Groq-Key', es: 'Clave Groq', fr: 'Clé Groq', ru: 'Ключ Groq', zh: 'Groq 密钥',
  },
  groq_fallback_key_placeholder: {
    en: 'Groq key (optional)', tr: 'Groq key (opsiyonel)', de: 'Groq-Key (optional)', es: 'Clave Groq (opcional)', fr: 'Clé Groq (facultative)', ru: 'Ключ Groq (необязательно)', zh: 'Groq 密钥（可选）',
  },
  groq_primary_key_meta_tip: {
    en: 'Primary Groq API key used to generate the title and description.',
    tr: 'Başlık ve açıklama üretiminde kullanılan birincil Groq API anahtarı.',
    de: 'Primärer Groq-API-Key für die Titel- und Beschreibungserstellung.',
    es: 'Clave API de Groq principal usada para generar el título y la descripción.',
    fr: "Clé API Groq principale utilisée pour générer le titre et la description.",
    ru: 'Основной API-ключ Groq, используемый для генерации заголовка и описания.',
    zh: '用于生成标题和描述的主要 Groq API 密钥。',
  },
  groq_primary_key_keywords_tip: {
    en: 'Primary Groq API key used to generate keywords. You can use a different key from the Title & Description group to keep their rate limits separate.',
    tr: 'Anahtar kelime üretiminde kullanılan birincil Groq API anahtarı. Başlık/Açıklama grubundakinden farklı bir anahtar girerek limitleri ayrı tutabilirsiniz.',
    de: 'Primärer Groq-API-Key für die Keyword-Erstellung. Sie können einen anderen Key als in der Gruppe „Titel & Beschreibung“ verwenden, um die Limits getrennt zu halten.',
    es: 'Clave API de Groq principal usada para generar palabras clave. Puedes usar una clave distinta a la del grupo Título y descripción para mantener los límites separados.',
    fr: "Clé API Groq principale utilisée pour générer les mots-clés. Vous pouvez utiliser une clé différente de celle du groupe Titre et description pour séparer les limites.",
    ru: 'Основной API-ключ Groq, используемый для генерации ключевых слов. Вы можете использовать другой ключ, отличный от группы «Заголовок и описание», чтобы разделить лимиты.',
    zh: '用于生成关键词的主要 Groq API 密钥。您可以使用与"标题与描述"组不同的密钥，以便分开限额。',
  },
  groq_fallback_key_tip: {
    en: 'Backup Groq key that kicks in automatically if the primary key hits its rate limit.',
    tr: 'Birincil anahtar limit aşımına (rate limit) uğrarsa otomatik devreye giren yedek Groq anahtarı.',
    de: 'Ersatz-Groq-Key, der automatisch einspringt, wenn der primäre Key sein Limit erreicht.',
    es: 'Clave Groq de respaldo que se activa automáticamente si la clave principal alcanza su límite.',
    fr: "Clé Groq de secours qui prend automatiquement le relais si la clé principale atteint sa limite.",
    ru: 'Резервный ключ Groq, который автоматически включается, если основной ключ достиг лимита.',
    zh: '当主密钥达到速率限制时自动启用的备用 Groq 密钥。',
  },
  openrouter_group_tip: {
    en: 'Fallback provider used as a last resort once every Groq key in this group is exhausted.',
    tr: 'Bu gruptaki tüm Groq anahtarları tükendiğinde son çare olarak kullanılan yedek sağlayıcı.',
    de: 'Fallback-Anbieter, der als letztes Mittel verwendet wird, wenn alle Groq-Keys dieser Gruppe erschöpft sind.',
    es: 'Proveedor de respaldo usado como último recurso cuando se agotan todas las claves Groq de este grupo.',
    fr: "Fournisseur de secours utilisé en dernier recours lorsque toutes les clés Groq de ce groupe sont épuisées.",
    ru: 'Резервный провайдер, используемый в крайнем случае, когда все ключи Groq в этой группе исчерпаны.',
    zh: '当此组中所有 Groq 密钥都用尽时作为最后手段使用的备用提供商。',
  },
  ep_id_tip: {
    en: 'Everypixels Client ID for keyword generation (paid, optional — leave empty to generate keywords with Groq instead).',
    tr: 'Anahtar kelime üretimi için Everypixels servisinin Client ID bilgisi (ücretli, opsiyonel — boş bırakılırsa keyword üretimi Groq ile yapılır).',
    de: 'Everypixels-Client-ID für die Keyword-Erstellung (kostenpflichtig, optional — leer lassen, um Keywords stattdessen mit Groq zu erstellen).',
    es: 'Client ID de Everypixels para generar palabras clave (de pago, opcional — déjalo vacío para generarlas con Groq).',
    fr: "Client ID Everypixels pour générer les mots-clés (payant, facultatif — laissez vide pour générer les mots-clés avec Groq à la place).",
    ru: 'Client ID Everypixels для генерации ключевых слов (платно, необязательно — оставьте пустым, чтобы генерировать ключевые слова через Groq).',
    zh: '用于生成关键词的 Everypixels 客户端 ID（付费，可选——留空则改用 Groq 生成关键词）。',
  },
  ep_secret_tip: {
    en: 'Secret key used together with the Everypixels Client ID.',
    tr: 'Everypixels Client ID ile birlikte kullanılan gizli anahtar.',
    de: 'Geheimer Schlüssel, der zusammen mit der Everypixels-Client-ID verwendet wird.',
    es: 'Clave secreta usada junto con el Client ID de Everypixels.',
    fr: "Clé secrète utilisée avec le Client ID Everypixels.",
    ru: 'Секретный ключ, используемый вместе с Client ID Everypixels.',
    zh: '与 Everypixels 客户端 ID 一起使用的密钥。',
  },
  save_btn: {
    en: '💾 Save', tr: '💾 Kaydet', de: '💾 Speichern', es: '💾 Guardar', fr: '💾 Enregistrer', ru: '💾 Сохранить', zh: '💾 保存',
  },
  istock_modal_title: {
    en: 'iStock Keyword Mapping', tr: 'iStock Keyword Eşleştirmesi', de: 'iStock-Keyword-Zuordnung', es: 'Asignación de palabras clave de iStock', fr: 'Correspondance des mots-clés iStock', ru: 'Сопоставление ключевых слов iStock', zh: 'iStock 关键词映射',
  },
  generic_word_placeholder: {
    en: 'Generic word', tr: 'Genel kelime', de: 'Allgemeines Wort', es: 'Palabra genérica', fr: 'Mot générique', ru: 'Общее слово', zh: '通用词',
  },
  istock_equivalent_placeholder: {
    en: 'iStock equivalent', tr: 'iStock karşılığı', de: 'iStock-Entsprechung', es: 'Equivalente en iStock', fr: 'Équivalent iStock', ru: 'Эквивалент iStock', zh: 'iStock 对应词',
  },
  add_btn: {
    en: '+ Add', tr: '+ Ekle', de: '+ Hinzufügen', es: '+ Añadir', fr: '+ Ajouter', ru: '+ Добавить', zh: '+ 添加',
  },
  istock_already_note: {
    en: '"{key}" is already in the library{arrow} Update it with Add.',
    tr: '"{key}" zaten kütüphanede{arrow} Ekle ile güncellersiniz.',
    de: '„{key}" ist bereits in der Bibliothek{arrow} Mit Hinzufügen aktualisieren.',
    es: '"{key}" ya está en la biblioteca{arrow} Actualízalo con Añadir.',
    fr: '« {key} » est déjà dans la bibliothèque{arrow} Mettez à jour avec Ajouter.',
    ru: '«{key}» уже есть в библиотеке{arrow} Обновите через «Добавить».',
    zh: '"{key}" 已在词库中{arrow} 点击"添加"进行更新。',
  },
  video_frame_use_btn: {
    en: '✓ Use this frame', tr: '✓ Bu kareyi kullan', de: '✓ Diesen Frame verwenden', es: '✓ Usar este fotograma', fr: '✓ Utiliser cette image', ru: '✓ Использовать этот кадр', zh: '✓ 使用此帧',
  },
  video_frame_reset_btn: {
    en: 'Start from the middle', tr: 'Ortadan başlasın', de: 'Ab der Mitte', es: 'Empezar desde el medio', fr: 'Recommencer au milieu', ru: 'Начать с середины', zh: '从中间开始',
  },
  video_frame_cancel_btn: {
    en: 'Cancel', tr: 'İptal', de: 'Abbrechen', es: 'Cancelar', fr: 'Annuler', ru: 'Отмена', zh: '取消',
  },
  err_groq_key_missing: {
    en: 'No Groq API key entered. Add at least one key in Settings.',
    tr: "Groq API key girilmemiş. Ayarlar'dan en az bir key ekleyin.",
    de: 'Kein Groq-API-Key hinterlegt. Fügen Sie in den Einstellungen mindestens einen Key hinzu.',
    es: 'No se ha introducido ninguna clave API de Groq. Añade al menos una en Ajustes.',
    fr: "Aucune clé API Groq renseignée. Ajoutez au moins une clé dans les Paramètres.",
    ru: 'API-ключ Groq не введён. Добавьте хотя бы один ключ в настройках.',
    zh: '未填写 Groq API 密钥。请在设置中至少添加一个密钥。',
  },
  err_request_timeout: {
    en: '{label}: Request timed out (90 seconds). Please try again.',
    tr: '{label}: İstek zaman aşımına uğradı (90 saniye). Lütfen tekrar deneyin.',
    de: '{label}: Zeitüberschreitung der Anfrage (90 Sekunden). Bitte erneut versuchen.',
    es: '{label}: La solicitud agotó el tiempo de espera (90 segundos). Inténtalo de nuevo.',
    fr: "{label} : Délai d'attente de la requête dépassé (90 secondes). Veuillez réessayer.",
    ru: '{label}: Истекло время ожидания запроса (90 секунд). Попробуйте ещё раз.',
    zh: '{label}：请求超时（90 秒）。请重试。',
  },
  err_connection_failed: {
    en: '{label}: Connection failed. Check your internet connection.',
    tr: '{label}: Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.',
    de: '{label}: Verbindung fehlgeschlagen. Bitte Internetverbindung prüfen.',
    es: '{label}: No se pudo conectar. Comprueba tu conexión a internet.',
    fr: "{label} : Connexion impossible. Vérifiez votre connexion internet.",
    ru: '{label}: Не удалось подключиться. Проверьте интернет-соединение.',
    zh: '{label}：无法连接。请检查网络连接。',
  },
  err_api_key_invalid: {
    en: '{label}: The API key looks invalid. Check it in Settings.',
    tr: "{label}: API key hatalı görünüyor. Ayarlar'dan kontrol edin.",
    de: '{label}: API-Key scheint ungültig zu sein. Bitte in den Einstellungen prüfen.',
    es: '{label}: La clave API parece incorrecta. Compruébala en Ajustes.',
    fr: "{label} : La clé API semble incorrecte. Vérifiez-la dans les Paramètres.",
    ru: '{label}: API-ключ выглядит неверным. Проверьте в настройках.',
    zh: '{label}：API 密钥似乎无效。请在设置中检查。',
  },
  err_server_error: {
    en: '{label}: Server error ({status}). {text}',
    tr: '{label}: Sunucu hatası ({status}). {text}',
    de: '{label}: Serverfehler ({status}). {text}',
    es: '{label}: Error del servidor ({status}). {text}',
    fr: '{label} : Erreur serveur ({status}). {text}',
    ru: '{label}: Ошибка сервера ({status}). {text}',
    zh: '{label}：服务器错误（{status}）。{text}',
  },
  err_rate_limited: {
    en: "{label}: Your API limit is reached. Please wait a moment and try again (or add another key/OpenRouter fallback in Settings).",
    tr: "{label}: API limitiniz doldu. Lütfen biraz bekleyip tekrar deneyin (veya Ayarlar'dan ek bir key/OpenRouter yedeği ekleyin).",
    de: '{label}: API-Limit erreicht. Bitte etwas warten und erneut versuchen (oder in den Einstellungen einen weiteren Key/OpenRouter-Fallback hinzufügen).',
    es: '{label}: Se alcanzó el límite de la API. Espera un momento e inténtalo de nuevo (o añade otra clave/respaldo OpenRouter en Ajustes).',
    fr: "{label} : Limite de l'API atteinte. Patientez un instant puis réessayez (ou ajoutez une clé supplémentaire/un secours OpenRouter dans les Paramètres).",
    ru: '{label}: Лимит API исчерпан. Подождите немного и попробуйте снова (или добавьте ещё один ключ/резерв OpenRouter в настройках).',
    zh: '{label}：已达 API 限额。请稍等后重试（或在设置中添加更多密钥/OpenRouter 备用）。',
  },
  err_json_not_found: {
    en: 'Could not process response: no JSON found{preview}',
    tr: 'Yanıt işlenemedi: JSON bulunamadı{preview}',
    de: 'Antwort konnte nicht verarbeitet werden: Kein JSON gefunden{preview}',
    es: 'No se pudo procesar la respuesta: no se encontró JSON{preview}',
    fr: "Impossible de traiter la réponse : aucun JSON trouvé{preview}",
    ru: 'Не удалось обработать ответ: JSON не найден{preview}',
    zh: '无法处理响应：未找到 JSON{preview}',
  },
  err_json_parse_failed: {
    en: 'Could not process response: JSON parsing failed.',
    tr: 'Yanıt işlenemedi: JSON ayrıştırılamadı.',
    de: 'Antwort konnte nicht verarbeitet werden: JSON konnte nicht geparst werden.',
    es: 'No se pudo procesar la respuesta: no se pudo analizar el JSON.',
    fr: "Impossible de traiter la réponse : échec de l'analyse du JSON.",
    ru: 'Не удалось обработать ответ: не удалось разобрать JSON.',
    zh: '无法处理响应：JSON 解析失败。',
  },
  everypixel_invalid_key: {
    en: 'Everypixel: Invalid API key (check Client ID / Secret).',
    tr: 'Everypixel: Geçersiz API anahtarı (Client ID / Secret kontrol edin).',
    de: 'Everypixel: Ungültiger API-Schlüssel (Client-ID / Secret prüfen).',
    es: 'Everypixel: Clave API no válida (comprueba Client ID / Secret).',
    fr: 'Everypixel : Clé API invalide (vérifiez Client ID / Secret).',
    ru: 'Everypixel: Неверный API-ключ (проверьте Client ID / Secret).',
    zh: 'Everypixel：API 密钥无效（请检查 Client ID / Secret）。',
  },
  everypixel_quota: {
    en: 'Everypixel: Quota exceeded. Check your usage limit.',
    tr: 'Everypixel: Kota aşıldı. Lütfen kullanım limitinizi kontrol edin.',
    de: 'Everypixel: Kontingent überschritten. Bitte Nutzungslimit prüfen.',
    es: 'Everypixel: Cuota superada. Comprueba tu límite de uso.',
    fr: "Everypixel : Quota dépassé. Vérifiez votre limite d'utilisation.",
    ru: 'Everypixel: Квота превышена. Проверьте лимит использования.',
    zh: 'Everypixel：配额已超限。请检查使用限额。',
  },
  everypixel_busy: {
    en: 'Everypixel: Server busy. Slow down requests and try again.',
    tr: 'Everypixel: Sunucu yoğun. İstekleri biraz yavaşlatıp tekrar deneyin.',
    de: 'Everypixel: Server ausgelastet. Anfragen verlangsamen und erneut versuchen.',
    es: 'Everypixel: Servidor ocupado. Reduce la frecuencia de solicitudes e inténtalo de nuevo.',
    fr: 'Everypixel : Serveur occupé. Ralentissez les requêtes et réessayez.',
    ru: 'Everypixel: Сервер перегружен. Замедлите запросы и попробуйте снова.',
    zh: 'Everypixel：服务器繁忙。请放慢请求速度后重试。',
  },
  everypixel_cors: {
    en: 'Everypixel: The request could not be sent from the browser (likely a CORS block). This API may not be callable directly from the browser — a backend proxy may be needed.',
    tr: 'Everypixel: İstek tarayıcıdan gönderilemedi (muhtemelen CORS engeli). Bu API doğrudan tarayıcıdan çağrılamıyor olabilir — bir backend proxy gerekebilir.',
    de: 'Everypixel: Anfrage konnte nicht vom Browser gesendet werden (vermutlich CORS-Blockade). Diese API ist möglicherweise nicht direkt aus dem Browser aufrufbar — ein Backend-Proxy könnte nötig sein.',
    es: 'Everypixel: No se pudo enviar la solicitud desde el navegador (probablemente bloqueo CORS). Es posible que esta API no se pueda llamar directamente desde el navegador — puede requerir un proxy de backend.',
    fr: "Everypixel : La requête n'a pas pu être envoyée depuis le navigateur (probablement un blocage CORS). Cette API n'est peut-être pas appelable directement depuis le navigateur — un proxy backend peut être nécessaire.",
    ru: 'Everypixel: Не удалось отправить запрос из браузера (вероятно, блокировка CORS). Этот API может быть недоступен напрямую из браузера — может потребоваться прокси на backend.',
    zh: 'Everypixel：无法从浏览器发送请求（可能是 CORS 阻止）。此 API 或许无法直接从浏览器调用——可能需要后端代理。',
  },
  everypixel_invalid_response: {
    en: 'Everypixel: Invalid response.', tr: 'Everypixel: Geçersiz yanıt.', de: 'Everypixel: Ungültige Antwort.', es: 'Everypixel: Respuesta no válida.', fr: 'Everypixel : Réponse invalide.', ru: 'Everypixel: Недопустимый ответ.', zh: 'Everypixel：响应无效。',
  },
};

export function translate(key: keyof typeof STRINGS, lang: UILang, vars?: Record<string, string | number>): string {
  const entry = STRINGS[key];
  let s = entry ? (entry[lang] ?? entry.tr) : String(key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

export function isUILang(code: string): code is UILang {
  return SECONDARY_LANGUAGES.some((l) => l.code === code);
}
