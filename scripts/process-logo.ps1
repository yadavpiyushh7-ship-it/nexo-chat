$code = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class ImageProcessorSafe {
    public static void MakeOuterTransparent(string inputPath, string outputPath, int targetSize) {
        using (Bitmap src = new Bitmap(inputPath)) {
            int w = src.Width;
            int h = src.Height;
            BitmapData data = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            
            int bytes = Math.Abs(data.Stride) * h;
            byte[] rgbValues = new byte[bytes];
            Marshal.Copy(data.Scan0, rgbValues, 0, bytes);

            bool[,] visited = new bool[w, h];
            Queue<Point> q = new Queue<Point>();

            Func<int, int, bool> isNearWhite = (x, y) => {
                int idx = y * data.Stride + x * 4;
                byte b = rgbValues[idx];
                byte g = rgbValues[idx + 1];
                byte r = rgbValues[idx + 2];
                // Outer background threshold
                return (r >= 235 && g >= 235 && b >= 235);
            };

            for (int x = 0; x < w; x++) {
                if (isNearWhite(x, 0)) { q.Enqueue(new Point(x, 0)); visited[x, 0] = true; }
                if (isNearWhite(x, h - 1)) { q.Enqueue(new Point(x, h - 1)); visited[x, h - 1] = true; }
            }
            for (int y = 0; y < h; y++) {
                if (isNearWhite(0, y)) { q.Enqueue(new Point(0, y)); visited[0, y] = true; }
                if (isNearWhite(w - 1, y)) { q.Enqueue(new Point(w - 1, y)); visited[w - 1, y] = true; }
            }

            int[] dx = { 1, -1, 0, 0, 1, 1, -1, -1 };
            int[] dy = { 0, 0, 1, -1, 1, -1, 1, -1 };

            while (q.Count > 0) {
                Point p = q.Dequeue();
                int idx = p.Y * data.Stride + p.X * 4;
                rgbValues[idx + 3] = 0; // Set Alpha to 0 (transparent)

                for (int i = 0; i < 8; i++) {
                    int nx = p.X + dx[i];
                    int ny = p.Y + dy[i];
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited[nx, ny]) {
                        visited[nx, ny] = true;
                        if (isNearWhite(nx, ny)) {
                            q.Enqueue(new Point(nx, ny));
                        }
                    }
                }
            }

            Marshal.Copy(rgbValues, 0, data.Scan0, bytes);
            src.UnlockBits(data);

            using (Bitmap dest = new Bitmap(targetSize, targetSize, PixelFormat.Format32bppArgb)) {
                using (Graphics g = Graphics.FromImage(dest)) {
                    g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                    g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
                    g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
                    g.DrawImage(src, new Rectangle(0, 0, targetSize, targetSize));
                }
                dest.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
'@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing

$inputPath = "C:\Users\yadav\Downloads\Gemini_Generated_Image_vw4o6vw4o6vw4o6v.png"
$tmp = "$PSScriptRoot\temp_logo.png"
$finalLogo = "$PSScriptRoot\..\public\logo.png"

[ImageProcessorSafe]::MakeOuterTransparent($inputPath, $tmp, 512)
Copy-Item $tmp $finalLogo -Force
Remove-Item $tmp -Force
Write-Output "Successfully processed logo.png with transparent background!"
