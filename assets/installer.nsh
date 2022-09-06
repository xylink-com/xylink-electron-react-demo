!macro customInstall
  DeleteRegKey HKCR "xylink-electron"
  WriteRegStr HKCR "xylink-electron" "" "URL:xylink-electron"
  WriteRegStr HKCR "xylink-electron" "URL Protocol" ""
  WriteRegStr HKCR "xylink-electron\shell" "" ""
  WriteRegStr HKCR "xylink-electron\shell\open" "" ""
  WriteRegStr HKCR "xylink-electron\shell\open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1"
!macroend

!macro customUnInstall
  DeleteRegKey HKCR "xylink-electron"
!macroend
