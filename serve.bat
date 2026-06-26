@echo off
echo Starting Bookie local server...
echo Open http://localhost:8080 in your browser
echo Press Ctrl+C to stop
python -m http.server 8080 --directory "%~dp0"
pause
