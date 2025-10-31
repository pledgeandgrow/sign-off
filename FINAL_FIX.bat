@echo off
echo ========================================
echo FIX DEFINITIF: Suppression de react-native-reanimated
echo ========================================
echo.

echo Cette solution supprime react-native-reanimated qui cause le probleme.
echo Les animations complexes ne fonctionneront pas, mais l'app demarrera.
echo.
pause

echo [1/3] Desinstallation de react-native-reanimated...
call npm uninstall react-native-reanimated react-native-worklets-core

echo.
echo [2/3] Nettoyage du cache...
call npm cache clean --force

echo.
echo [3/3] Termine! Lancez maintenant:
echo npx expo start --clear
echo.
echo Note: Si vous avez besoin d'animations, il faudra resoudre
echo le probleme de react-native-worklets/plugin plus tard.
echo.
pause
