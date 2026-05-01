<?php
session_start();
$isAdminLoggedIn = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download - Araro Games</title>
    <!-- Tailwind CSS (CDN for development only) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Tajawal:wght@300;400;500;700;800;900&family=Fira+Code:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link rel="stylesheet" href="css/download.css">
</head>
<body class="body-main download-page" data-theme="dark" data-lang="en" data-dir="ltr">
    <!-- Navigation Header -->
    <header class="main-header" id="header">
        <nav class="nav-container">
            <div class="nav-brand">
                <div class="brand-logo">
                    <span class="logo-text">Araro Games</span>
                </div>
            </div>

            <div class="nav-menu" id="navMenu">
                <a href="/index.php#home" class="nav-link" data-section="home">
                    <i class="fas fa-home"></i>
                    <span class="nav-text" data-text-en="Home" data-text-ar="Tahanan">Home</span>
                </a>
                <a href="/index.php#about" class="nav-link" data-section="about">
                    <i class="fas fa-user"></i>
                    <span class="nav-text" data-text-en="About" data-text-ar="Tungkol">About</span>
                </a>
                <a href="/index.php#skills" class="nav-link" data-section="skills">
                    <i class="fas fa-code"></i>
                    <span class="nav-text" data-text-en="Skills" data-text-ar="Kasanayan">Skills</span>
                </a>
                <a href="/index.php#projects" class="nav-link" data-section="projects">
                    <i class="fas fa-rocket"></i>
                    <span class="nav-text" data-text-en="Models" data-text-ar="Mga Modelo">Models</span>
                </a>
                <a href="index.php" class="nav-link active" data-section="download">
                    <i class="fas fa-download"></i>
                    <span class="nav-text" data-text-en="Download" data-text-ar="I-download">Download</span>
                </a>
                <?php if ($isAdminLoggedIn): ?>
                <a href="/page/AdminDashboard/index.php" class="nav-link" data-section="admin-dashboard">
                    <i class="fas fa-shield-halved"></i>
                    <span class="nav-text" data-text-en="Admin Dashboard" data-text-ar="Admin Dashboard">Admin Dashboard</span>
                </a>
                <?php endif; ?>
            </div>

            <div class="nav-controls">
                <button class="lang-toggle" id="langToggle" title="Toggle Language">
                    <i class="fas fa-language"></i>
                    <span class="lang-text">AR</span>
                </button>
                <button class="theme-toggle" id="themeToggle" title="Toggle Theme">
                    <i class="fas fa-moon"></i>
                </button>
                <button class="menu-toggle" id="menuToggle" title="Toggle Menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main class="main-content page-shell download-shell">
        <div class="download-container">
            <h1>Download Araro Games</h1>
            <p>Get the game and start your adventure!</p>
            <div class="download-options">
                <div class="download-card">
                    <h3>Windows</h3>
                    <p>Download for Windows</p>
                    <a href="#" class="btn btn-primary">Download .exe</a>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="main-footer">
        <div class="footer-container">
            <div class="footer-content">
                <div class="footer-text-wrapper">
                    <p class="footer-text">
                        <span class="footer-copyright">© 2025 Araro Games</span>
                        <span class="footer-divider">•</span>
                        <span class="footer-built">Built with passion and code</span>
                    </p>
                    <p class="footer-author">
                        <span class="footer-by-text" data-text-en="by" data-text-ar="ni">by</span>
                        <a href="https://www.linkedin.com/in/mohammad-abu-sakour-kn" target="_blank" rel="noopener noreferrer" class="footer-author-link">
                            <i class="fas fa-code"></i>
                            <span>Kan3an</span>
                        </a>
                    </p>
                </div>
                <div class="footer-social">
                    <a href="https://www.linkedin.com/in/mohammad-abu-sakour-kn" target="_blank" rel="noopener noreferrer" class="footer-social-link">
                        <i class="fab fa-linkedin-in"></i>
                    </a>
                    <a href="#" class="footer-social-link" title="GitHub">
                        <i class="fab fa-github"></i>
                    </a>
                    <a href="#" class="footer-social-link" title="Twitter">
                        <i class="fab fa-twitter"></i>
                    </a>
                </div>
            </div>
        </div>
    </footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    <script src="../../assets/js/style.js"></script>
    <script src="js/download.js"></script>
</body>
</html>
