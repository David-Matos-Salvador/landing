# music

Canciones del reproductor de la landing. **Solo música con derecho de uso público**
(propia, royalty-free, Creative Commons o IA con licencia que lo permita). Nunca canciones comerciales.

## Agregar una canción

1. Copia el mp3 a esta carpeta con un nombre simple: minúsculas, sin espacios ni tildes
   (ej. `noche-en-lima.mp3`). Idealmente 128–192 kbps y menos de 10 MB.
2. Agrégala a `playlist.json` (el orden del archivo es el orden del reproductor):
   ```json
   {
     "title": "Noche en Lima",
     "artist": "Nombre del autor",
     "file": "noche-en-lima.mp3",
     "bpm": 128,
     "credit": "Music by Autor (CC BY 4.0)"
   }
   ```
   - `bpm`: tempo aproximado; la escena "baila" a ese ritmo (si no lo sabes, deja 128).
   - `credit`: déjalo vacío salvo que la licencia pida mencionar al autor (p. ej. CC BY).
3. Publica: `git add public/music && git commit -m "Nueva canción" && git push`.
   Coolify despliega solo (Auto Deploy).

Las pistas `lluvia-de-medianoche.mp3` y `cafe-y-requinto.mp3` son de prueba, generadas con código.
