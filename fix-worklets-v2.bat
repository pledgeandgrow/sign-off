@echo off
echo ========================================
echo Fix: react-native-worklets/plugin error
echo ========================================
echo.

echo [1/6] Desinstallation des packages problematiques...
call npm uninstall react-native-reanimated react-native-worklets-core

echo.
echo [2/6] Nettoyage du cache npm...
call npm cache clean --force

echo.
echo [3/6] Suppression de node_modules...
rmdir /s /q node_modules

echo.
echo [4/6] Reinstallation des dependances (avec --legacy-peer-deps)...
call npm install --legacy-peer-deps

echo.
echo [5/6] Installation de react-native-reanimated...
call npx expo install react-native-reanimated

echo.
echo [6/6] Termine! Vous pouvez maintenant lancer:
echo npx expo start --clear
echo.
pause
