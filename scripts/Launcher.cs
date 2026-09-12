using System;
using System.Diagnostics;
using System.IO;

class Launcher {
    static void Main(string[] args) {
        string currentDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
        string bootstrapPath = Path.Combine(currentDir, "scripts", "bootstrap.ps1");
        string psArgs = "-NoLogo -NoProfile -ExecutionPolicy Bypass -File \"" + bootstrapPath + "\"";

        bool hasWt = false;
        try {
            using (var p = Process.Start(new ProcessStartInfo {
                FileName = "where",
                Arguments = "wt.exe",
                CreateNoWindow = true,
                UseShellExecute = false
            })) {
                p.WaitForExit();
                hasWt = (p.ExitCode == 0);
            }
        } catch {}

        ProcessStartInfo psi;
        if (hasWt) {
            psi = new ProcessStartInfo {
                FileName = "wt.exe",
                Arguments = "-d \"" + currentDir + "\" powershell.exe " + psArgs,
                WorkingDirectory = currentDir,
                UseShellExecute = true
            };
        } else {
            psi = new ProcessStartInfo {
                FileName = "powershell.exe",
                Arguments = psArgs,
                WorkingDirectory = currentDir,
                UseShellExecute = true
            };
        }

        try {
            Process.Start(psi);
        } catch (Exception ex) {
            Console.WriteLine("Error: " + ex.Message);
            Console.ReadLine();
        }
    }
}
