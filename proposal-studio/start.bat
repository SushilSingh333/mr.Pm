@echo off
REM ── MrPackerMover Proposal Studio — one-click launcher ──────────────
REM Serves this folder on http://localhost:8000 so the one-click
REM "Download PDF" works cleanly, then opens your browser.

cd /d "%~dp0"
set PORT=8000
set SRV=

where python >nul 2>nul && set "SRV=python -m http.server %PORT%"
if not defined SRV ( where py     >nul 2>nul && set "SRV=py -m http.server %PORT%" )
if not defined SRV ( where node   >nul 2>nul && set "SRV=npx --yes serve -l %PORT%" )

if not defined SRV goto :nosrv

echo Starting local server on http://localhost:%PORT%/ ...
start "MrPackerMover Proposal Server" cmd /k %SRV%
timeout /t 2 >nul
start "" http://localhost:%PORT%/
echo.
echo Browser opened. Keep the little server window open while you work.
echo Close that window when you're done.
exit /b

:nosrv
echo.
echo Could not find Python or Node.js to run a local server.
echo Easiest fix: install Python from https://www.python.org/downloads/
echo (tick "Add python.exe to PATH" in the installer), then run start.bat again.
echo.
echo You can still open index.html directly and use the Print button
echo (choose "Save as PDF", A4, Margins: None).
echo.
pause
