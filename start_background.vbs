Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Arman\.gemini\antigravity\scratch\telegram-poker"
WshShell.Run "cmd /c node launch.mjs", 0, False
Set WshShell = Nothing
