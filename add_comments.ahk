#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
#Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

NumFrames = 10

#IfWinActive Google Docs
ScrollLock::
Loop, %NumFrames% {
	Send {End}a+{Left}
	Sleep 1000
	Send {Ctrl down}{Alt down}m{Alt up}{Ctrl Up}
	Sleep 1000
	Send a^{Enter}
	Sleep 1000
}
return
