@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   本地预览：http://localhost:5178
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  for /f "tokens=1" %%b in ("%%a") do echo   手机访问：http://%%b:5178
)
echo.
echo   按 Ctrl+C 停止
echo.
python -m http.server 5178 --bind 0.0.0.0
