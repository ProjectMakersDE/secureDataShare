# SecureDataShare

Einfache Web-Anwendung für sicheren Datei- und Text-Upload. Nur Upload, kein Download oder Ansicht möglich.

## Features

- Name/Bezeichnung eingeben (wird als Ordnername verwendet)
- Mehrere Dateien gleichzeitig hochladen (Drag & Drop)
- Optionales Textfeld (wird als `message.txt` gespeichert)
- Alle Limits über Environment-Variablen konfigurierbar
- Formular wird nach erfolgreichem Upload geleert
- Modernes UI mit Tailwind CSS

## Schnellstart

```bash
# Repository klonen
git clone https://github.com/YOUR_USERNAME/secureDataShare.git
cd secureDataShare

# Upload-Verzeichnis erstellen
sudo mkdir -p /mnt/secureDataShare/uploads
sudo chown $USER:$USER /mnt/secureDataShare/uploads

# Container starten
docker-compose up -d --build
```

Die Anwendung ist dann unter http://localhost:8101 erreichbar.

## Konfiguration

Umgebungsvariablen können in einer `.env` Datei oder direkt gesetzt werden:

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `PORT` | 8101 | Server-Port |
| `MAX_FILE_SIZE_MB` | 50 | Max. Dateigröße in MB |
| `MAX_FILES` | 10 | Max. Anzahl Dateien pro Upload |
| `MAX_TEXT_LENGTH` | 4096 | Max. Textlänge in Zeichen |

Beispiel:
```bash
# .env Datei erstellen
cp .env.example .env

# Werte anpassen
nano .env
```

## Projektstruktur

```
secureDataShare/
├── app/
│   ├── app.py              # Flask Backend
│   ├── static/
│   │   ├── style.css       # Styling
│   │   └── script.js       # Upload-Logik
│   └── templates/
│       └── index.html      # Onepager
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env.example
```

## Upload-Speicherort

Uploads werden auf dem Host unter `/mnt/secureDataShare/uploads` gespeichert. Jeder Upload erstellt einen eigenen Ordner basierend auf dem eingegebenen Namen:

```
/mnt/secureDataShare/uploads/
├── projekt-alpha/
│   ├── dokument.pdf
│   ├── bild.png
│   └── message.txt
├── max-mustermann/
│   └── datei.zip
```

## Sicherheit

- Dateinamen werden mit Werkzeugs `secure_filename()` bereinigt
- Ordnernamen erlauben nur alphanumerische Zeichen und Bindestriche
- Kein Directory Listing
- Keine Download-Routen implementiert

## Reverse Proxy (nginx)

Beispiel-Konfiguration für nginx:

```nginx
server {
    listen 443 ssl;
    server_name upload.example.com;

    location / {
        proxy_pass http://localhost:8101;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 500M;
    }
}
```

## Lizenz

MIT
