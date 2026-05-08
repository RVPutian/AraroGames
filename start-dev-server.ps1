# Araro Games - Local Development Server Startup
# This script starts a simple static file server for the HTML site

$root = $PSScriptRoot
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://127.0.0.1:8000/')
$listener.Start()

Write-Host "Starting static development server..." -ForegroundColor Green
Write-Host "Open in browser: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Login page: http://127.0.0.1:8000/page/Login/index.html" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

function Get-ContentType([string]$extension) {
	switch ($extension.ToLowerInvariant()) {
		'.html' { 'text/html; charset=utf-8' }
		'.css' { 'text/css; charset=utf-8' }
		'.js' { 'application/javascript; charset=utf-8' }
		'.json' { 'application/json; charset=utf-8' }
		'.svg' { 'image/svg+xml' }
		'.png' { 'image/png' }
		'.jpg' { 'image/jpeg' }
		'.jpeg' { 'image/jpeg' }
		'.webp' { 'image/webp' }
		'.gif' { 'image/gif' }
		'.ico' { 'image/x-icon' }
		'.woff' { 'font/woff' }
		'.woff2' { 'font/woff2' }
		'.glb' { 'model/gltf-binary' }
		default { 'application/octet-stream' }
	}
}

try {
	while ($listener.IsListening) {
		$context = $listener.GetContext()
		$requestPath = $context.Request.Url.AbsolutePath.TrimStart('/')

		if ([string]::IsNullOrWhiteSpace($requestPath)) {
			$requestPath = 'index.html'
		}

		$relativePath = $requestPath -replace '/', [System.IO.Path]::DirectorySeparatorChar
		$filePath = Join-Path $root $relativePath

		if (Test-Path $filePath -PathType Container) {
			$filePath = Join-Path $filePath 'index.html'
		} elseif (-not [System.IO.Path]::HasExtension($filePath)) {
			$htmlPath = "$filePath.html"
			if (Test-Path $htmlPath -PathType Leaf) {
				$filePath = $htmlPath
			}
		}

		if (Test-Path $filePath -PathType Leaf) {
			$bytes = [System.IO.File]::ReadAllBytes($filePath)
			$context.Response.StatusCode = 200
			$context.Response.ContentType = Get-ContentType ([System.IO.Path]::GetExtension($filePath))
			$context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
		} else {
			$notFound = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
			$context.Response.StatusCode = 404
			$context.Response.ContentType = 'text/plain; charset=utf-8'
			$context.Response.OutputStream.Write($notFound, 0, $notFound.Length)
		}

		$context.Response.OutputStream.Close()
	}
} finally {
	if ($listener.IsListening) {
		$listener.Stop()
	}
	$listener.Close()
}
