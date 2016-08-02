!include "MUI2.nsh"

Name "Clever16"
BrandingText "aluxian.com"

# set the icon
!define MUI_ICON "icon.ico"

# define the resulting installer's name:
OutFile "..\dist\Clever16Setup.exe"

# set the installation directory
InstallDir "$PROGRAMFILES\Clever16\"

# app dialogs
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_RUN_TEXT "Start Clever16"
!define MUI_FINISHPAGE_RUN "$INSTDIR\Clever16.exe"

!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"

# default section start
Section

  # delete the installed files
  RMDir /r $INSTDIR

  # define the path to which the installer should install
  SetOutPath $INSTDIR

  # specify the files to go in the output path
  File /r ..\build\Clever16\win32\*

  # create the uninstaller
  WriteUninstaller "$INSTDIR\Uninstall Clever16.exe"

  # create shortcuts in the start menu and on the desktop
  CreateShortCut "$SMPROGRAMS\Clever16.lnk" "$INSTDIR\Clever16.exe"
  CreateShortCut "$SMPROGRAMS\Uninstall Clever16.lnk" "$INSTDIR\Uninstall Clever16.exe"
  CreateShortCut "$DESKTOP\Clever16.lnk" "$INSTDIR\Clever16.exe"

SectionEnd

# create a section to define what the uninstaller does
Section "Uninstall"

  # delete the installed files
  RMDir /r $INSTDIR

  # delete the shortcuts
  Delete "$SMPROGRAMS\Clever16.lnk"
  Delete "$SMPROGRAMS\Uninstall Clever16.lnk"
  Delete "$DESKTOP\Clever16.lnk"

SectionEnd
