import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  // Use session client only to get current user
  const sessionSupabase = await createClient();
  const { data: { user } } = await sessionSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use service role for DB operations
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { profilesCount, startUrl, os, selectedProfiles } = await request.json();

  // Parse profile names - if specified, use those; otherwise use count
  const profileNames = selectedProfiles
    ? selectedProfiles.split(",").map((p: string) => p.trim()).filter(Boolean)
    : null;

  // If profile names specified, profilesCount is ignored
  const effectiveCount = profileNames ? profileNames.length : profilesCount;

  // Get or create token
  let { data: tokenData } = await supabase
    .from("launcher_tokens")
    .select("token")
    .eq("user_id", user.id)
    .single();

  if (!tokenData) {
    const token = randomBytes(32).toString("hex");
    const { data: inserted, error } = await supabase
      .from("launcher_tokens")
      .insert({
        user_id: user.id,
        token,
        profiles_count: effectiveCount,
        is_active: true,
      })
      .select("token")
      .single();

    console.log("Token insert result:", inserted, error);
    tokenData = inserted;
  } else {
    await supabase
      .from("launcher_tokens")
      .update({ profiles_count: effectiveCount })
      .eq("user_id", user.id);
  }

  if (!tokenData?.token) {
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }

  const token = tokenData.token;
  const verifyUrl = `https://app.ticketclub.vip/api/launcher/verify?token=${token}`;
  const urlParam = startUrl ? startUrl : "";

  if (os === "mac") {
    const sh = `#!/bin/bash

echo ""
echo "================================================"
echo "  TICKETCLUB - Chrome Profile Launcher (Mac)"
echo "================================================"
echo ""
echo "Overuji licenci..."

VERIFY_URL="${verifyUrl}"
RESPONSE=$(curl -s -m 10 "$VERIFY_URL")

echo "Odpoved serveru: $RESPONSE"

if [ "$RESPONSE" != "VALID" ]; then
  echo ""
  echo "[CHYBA] Licence neni platna nebo vyprsela."
  echo "Prihlaste se na app.ticketclub.vip"
  echo ""
  read -p "Stisknete Enter pro ukonceni..."
  exit 1
fi

echo "[OK] Licence overena"
echo ""

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
USER_DATA="$HOME/Library/Application Support/Google/Chrome"
URL="${urlParam}"

echo "Spoustim Chrome profily..."
echo "------------------------------------------------"

# Default profil
if [ -d "$USER_DATA/Default" ]; then
  echo "Spoustim: Default profil"
  open -na "Google Chrome" --args --profile-directory="Default" $URL
  sleep 2
fi

${profileNames ?
  profileNames.map((name: string) => `
# Profil: ${name}
if [ -d "$USER_DATA/${name}" ]; then
  echo "Spoustim: ${name}"
  open -na "Google Chrome" --args --profile-directory="${name}" $URL
  sleep 2
else
  echo "[SKIP] Profil '${name}' nenalezen"
fi`).join("\n")
  :
  `# Otevri prvnich ${profilesCount} existujicich profilu
COUNT=0
for dir in "$USER_DATA/"Profile\ */; do
  if [ $COUNT -lt ${profilesCount} ]; then
    PROFILE_NAME=$(basename "$dir")
    echo "Spoustim: $PROFILE_NAME"
    open -na "Google Chrome" --args --profile-directory="$PROFILE_NAME" $URL
    sleep 2
    COUNT=$((COUNT + 1))
  fi
done`}

echo "------------------------------------------------"
echo "[OK] Vsechny profily zpracovany"

# Self-delete after execution
rm -- "$0"
`;

    return new NextResponse(sh, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="ticketclub-launcher.sh"',
      },
    });
  }

  // Generate .bat file (Windows default)
  const bat = `@echo off
setlocal enabledelayedexpansion
title TicketClub Chrome Launcher

echo.
echo  ================================================
echo   TICKETCLUB - Chrome Profile Launcher
echo  ================================================
echo.
echo  Overuji licenci...

:: Overeni licence
set "VERIFY_URL=${verifyUrl}"
set "RESPONSE="

:: Zkus PowerShell (dostupny na vsech modernich Windows)
for /f "delims=" %%a in ('powershell -NoProfile -Command "try { (Invoke-WebRequest -Uri '%VERIFY_URL%' -UseBasicParsing -TimeoutSec 10).Content.Trim() } catch { 'INVALID' }"') do set "RESPONSE=%%a"

echo  Odpoved serveru: !RESPONSE!

if "!RESPONSE!"=="VALID" (
    echo  [OK] Licence overena
    goto :START
)

echo.
echo  [CHYBA] Licence neni platna nebo vyprsela.
echo  Prihlaste se na app.ticketclub.vip
echo.
pause
exit /b 1

:START
echo.

:: Nastaveni
set "CHROME_PATH=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe
if not exist "%CHROME_PATH%" set "CHROME_PATH=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe
set "USER_DATA_DIR=%LOCALAPPDATA%\\Google\\Chrome\\User Data
set "URL=${urlParam}"

echo  Spoustim Chrome profily...
echo  ------------------------------------------------

:: Hlavni profil (Default)
if exist "%USER_DATA_DIR%\\Default" (
    echo  Spoustim: Default profil
    start "" "%CHROME_PATH%" --profile-directory="Default" --restore-last-session %URL%
    timeout /t 2 /nobreak >nul
)

${profileNames ?
  profileNames.map((name: string) => `
:: Profil: ${name}
if exist "%USER_DATA_DIR%\\${name}" (
    echo  Spoustim: ${name}
    start "" "%CHROME_PATH%" --profile-directory="${name}" --restore-last-session %URL%
    timeout /t 2 /nobreak >nul
) else (
    echo  [SKIP] Profil "${name}" nenalezen
)`).join("\n")
  :
  `:: Otevri prvnich ${profilesCount} existujicich profilu
set "COUNT=0"
for /D %%d in ("%USER_DATA_DIR%\\Profile *") do (
    if !COUNT! LSS ${profilesCount} (
        set /a COUNT+=1
        echo  Spoustim: %%~nd
        start "" "%CHROME_PATH%" --profile-directory="%%~nd" --restore-last-session %URL%
        timeout /t 2 /nobreak >nul
    )
)`}

echo  ------------------------------------------------
echo  [OK] Vsechny profily zpracovany
echo.

:: Self-delete after execution
(goto) 2>nul & del "%~f0"
`;

  return new NextResponse(bat, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="ticketclub-launcher.bat"',
    },
  });
}
