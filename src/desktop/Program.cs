using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace MiniBaseDesktop
{
    static class Program
    {
        static Process backendProcess = null;

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            int port = 8090;
            string url = "http://localhost:" + port + "/_/";

            // 1. Check if backend port 8090 is already running
            bool isRunning = IsPortInUse(port);

            if (!isRunning)
            {
                // Start Node.js backend silently in background (No black window!)
                string nodeExe = FindNodeExecutable();
                string serverScript = Path.Combine(appDir, "bin", "minibase.js");

                if (!File.Exists(serverScript))
                {
                    serverScript = Path.Combine(appDir, "src", "index.js");
                }

                if (File.Exists(nodeExe) && File.Exists(serverScript))
                {
                    try
                    {
                        ProcessStartInfo psi = new ProcessStartInfo();
                        psi.FileName = nodeExe;
                        psi.Arguments = "\"" + serverScript + "\" serve --no-open";
                        psi.WorkingDirectory = appDir;
                        psi.CreateNoWindow = true;
                        psi.UseShellExecute = false;
                        psi.WindowStyle = ProcessWindowStyle.Hidden;

                        backendProcess = Process.Start(psi);

                        // Wait for server to become responsive
                        int retries = 0;
                        while (!IsPortInUse(port) && retries < 25)
                        {
                            Thread.Sleep(200);
                            retries++;
                        }
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Failed to start MiniBase background engine: " + ex.Message, "MiniBase Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        return;
                    }
                }
            }

            // 2. Launch Dedicated Desktop Software Window
            LaunchAppWindow(url);
        }

        static bool IsPortInUse(int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    var result = client.BeginConnect("127.0.0.1", port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(300);
                    if (success && client.Connected)
                    {
                        client.EndConnect(result);
                        return true;
                    }
                    return false;
                }
            }
            catch
            {
                return false;
            }
        }

        static string FindNodeExecutable()
        {
            string pathEnv = Environment.GetEnvironmentVariable("PATH");
            if (!string.IsNullOrEmpty(pathEnv))
            {
                foreach (string path in pathEnv.Split(';'))
                {
                    string candidate = Path.Combine(path.Trim(), "node.exe");
                    if (File.Exists(candidate)) return candidate;
                }
            }

            string[] fallbacks = new string[] {
                @"C:\Program Files\nodejs\node.exe",
                @"C:\Program Files (x86)\nodejs\node.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\node\node.exe")
            };

            foreach (string p in fallbacks)
            {
                if (File.Exists(p)) return p;
            }

            return "node.exe";
        }

        static void LaunchAppWindow(string url)
        {
            string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            if (!File.Exists(edgePath))
            {
                edgePath = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            }

            string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
            if (!File.Exists(chromePath))
            {
                chromePath = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
            }

            string targetBrowser = null;
            if (File.Exists(edgePath)) targetBrowser = edgePath;
            else if (File.Exists(chromePath)) targetBrowser = chromePath;

            if (targetBrowser != null)
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = targetBrowser;
                psi.Arguments = "--app=\"" + url + "\" --window-size=1300,850 --title=\"MiniBase Studio\"";
                psi.UseShellExecute = false;

                Process appProc = Process.Start(psi);
                if (appProc != null && backendProcess != null)
                {
                    appProc.WaitForExit();
                    try
                    {
                        if (!backendProcess.HasExited)
                        {
                            backendProcess.Kill();
                        }
                    }
                    catch {}
                }
            }
            else
            {
                Process.Start(url);
            }
        }
    }
}
