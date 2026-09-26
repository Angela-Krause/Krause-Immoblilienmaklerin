$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 3464
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:${port}/")
$listener.Start()
Write-Host "Serving $root on http://localhost:${port}"

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.svg'  = 'image/svg+xml'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.woff' = 'font/woff'
  '.woff2'= 'font/woff2'
  '.ttf'  = 'font/ttf'
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  $path = [System.Uri]::UnescapeDataString($req.Url.LocalPath)
  if ($path.EndsWith('/')) { $path = $path + 'index.html' }
  $file = Join-Path $root ($path -replace '/', '\')
  if (Test-Path $file -PathType Leaf) {
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $res.StatusCode = 404
    $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
    $res.ContentLength64 = $body.Length
    $res.OutputStream.Write($body, 0, $body.Length)
  }
  $res.Close()
}
