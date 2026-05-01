<?php
session_start();

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: ../Login/index.php');
    exit;
}

$adminName = $_SESSION['admin_name'] ?? 'Admin';
$adminEmail = $_SESSION['admin_email'] ?? 'admin@araro.games';
$loginTime = $_SESSION['admin_login_time'] ?? 'Unknown';

$stats = [
    ['label' => 'Total Visits', 'value' => '18,420', 'icon' => 'fa-eye'],
    ['label' => 'Feedback Messages', 'value' => '126', 'icon' => 'fa-comments'],
    ['label' => 'Downloads', 'value' => '2,418', 'icon' => 'fa-download'],
    ['label' => 'Active Builds', 'value' => '4', 'icon' => 'fa-cubes']
];
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Araro Games</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Tajawal:wght@300;400;500;700;800;900&family=Fira+Code:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link rel="stylesheet" href="css/dashboard.css">
</head>
<body class="body-main dashboard-page" data-theme="dark" data-lang="en" data-dir="ltr">
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
                <a href="/page/Download/index.php" class="nav-link" data-section="download">
                    <i class="fas fa-download"></i>
                    <span class="nav-text" data-text-en="Download" data-text-ar="I-download">Download</span>
                </a>
                <a href="/page/AdminDashboard/index.php" class="nav-link active" data-section="admin-dashboard">
                    <i class="fas fa-shield-halved"></i>
                    <span class="nav-text" data-text-en="Admin Dashboard" data-text-ar="Admin Dashboard">Admin Dashboard</span>
                </a>
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

    <main class="main-content dashboard-shell">
        <section class="dashboard-header">
            <div>
                <p class="dashboard-kicker">Admin Dashboard</p>
                <h1>Welcome, <?php echo htmlspecialchars($adminName, ENT_QUOTES, 'UTF-8'); ?></h1>
                <p class="dashboard-subtitle">Logged in as <?php echo htmlspecialchars($adminEmail, ENT_QUOTES, 'UTF-8'); ?> at <?php echo htmlspecialchars($loginTime, ENT_QUOTES, 'UTF-8'); ?></p>
            </div>
            <a class="btn btn-secondary" href="/page/Login/index.php?logout=1">
                <i class="fas fa-right-from-bracket"></i>
                <span>Logout</span>
            </a>
        </section>

        <section class="dashboard-grid">
            <?php foreach ($stats as $stat): ?>
                <article class="dashboard-card">
                    <div class="dashboard-card-icon">
                        <i class="fas <?php echo htmlspecialchars($stat['icon'], ENT_QUOTES, 'UTF-8'); ?>"></i>
                    </div>
                    <div>
                        <p class="dashboard-card-label"><?php echo htmlspecialchars($stat['label'], ENT_QUOTES, 'UTF-8'); ?></p>
                        <h2><?php echo htmlspecialchars($stat['value'], ENT_QUOTES, 'UTF-8'); ?></h2>
                    </div>
                </article>
            <?php endforeach; ?>
        </section>

        <section class="dashboard-panel">
            <div class="panel-header">
                <h2>Recent Feedback</h2>
                <span class="panel-chip">Waiting for SQL</span>
            </div>
            <div class="feedback-empty-state">
                <i class="fas fa-inbox"></i>
                <p>No feedback records yet.</p>
                <small>This section is ready to show user feedback once you connect your SQL database.</small>
            </div>
        </section>
    </main>

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

    <script src="../../assets/js/style.js"></script>
    <script src="js/dashboard.js"></script>
</body>
</html>
