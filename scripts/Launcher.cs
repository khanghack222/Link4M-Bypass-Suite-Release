using System;
using System.Diagnostics;
using System.IO;
using System.Net;

class Launcher {
    static void Main(string[] args) {
        string currentDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
        string bootstrapPath = Path.Combine(currentDir, "scripts", "bootstrap.ps1");

        if (!File.Exists(bootstrapPath)) {
            Console.Title = "Link4M & Octolink Auto Setup";
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("\n=======================================================");
            Console.WriteLine("   ⚡ AUTO BYPASS SUITE - AUTO SETUP PACKAGE ⚡");
            Console.WriteLine("=======================================================\n");
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("[*] Dang tu dong dong bo ma nguon tu GitHub Release...");

            string zipUrl = "https://github.com/khanghack222/Link4M-Bypass-Suite-Release/releases/download/v1.1.0/Link4M_Native_Binary_Release.zip";
            string tempZip = Path.Combine(Path.GetTempPath(), "Link4M_Release.zip");
            string targetDir = Path.Combine(currentDir, "Link4M_Suite");

            try {
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072; // Tls12
                using (var client = new WebClient()) {
                    client.DownloadFile(zipUrl, tempZip);
                }
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[+] Da tai xong, dang giai nen thu muc...");

                var psiExtract = new ProcessStartInfo {
                    FileName = "powershell.exe",
                    Arguments = "-NoProfile -Command \"Expand-Archive -Path '" + tempZip + "' -DestinationPath '" + targetDir + "' -Force\"",
                    WindowStyle = ProcessWindowStyle.Hidden,
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                using (var p = Process.Start(psiExtract)) {
                    p.WaitForExit();
                }
                try { File.Delete(tempZip); } catch {}

                currentDir = targetDir;
                bootstrapPath = Path.Combine(currentDir, "scripts", "bootstrap.ps1");
            } catch (Exception ex) {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[!] Khong the tai tu dong: " + ex.Message);
                Console.WriteLine("Vui long tai file Link4M_Native_Binary_Release.zip va giai nen!");
                Console.ReadLine();
                return;
            }
        }

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
