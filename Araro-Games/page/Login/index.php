<?php
session_start();

$adminEmail = 'admin@araro.games';
$adminPassword = 'Araro@2026';

if (isset($_GET['logout'])) {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }
    session_destroy();
    header('Location: /page/Login/index.php');
    exit;
}

if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    header('Location: /index.php');
    exit;
}

$errorMessage = '';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($requestMethod === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($email === $adminEmail && $password === $adminPassword) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_email'] = $adminEmail;
        $_SESSION['admin_name'] = 'Admin';
        $_SESSION['admin_login_time'] = date('Y-m-d H:i:s');
        session_write_close();
        header('Location: /index.php');
        exit;
    }

    $errorMessage = 'Invalid email or password.';
}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Araro Games</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Tajawal:wght@300;400;500;700;800;900&family=Fira+Code:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link rel="stylesheet" href="css/login.css">
</head>
<body class="body-main auth-page" data-theme="dark" data-lang="en" data-dir="ltr">
    <main class="auth-shell">
        <section class="auth-card">
            <div class="auth-brand">
                <div class="auth-badge">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <h1>Admin Login</h1>
                <p>Private access for the dashboard.</p>
            </div>

            <?php if ($errorMessage !== ''): ?>
                <div class="auth-alert" role="alert"><?php echo htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8'); ?></div>
            <?php endif; ?>

            <form class="auth-form" method="post" action="index.php" autocomplete="off">
                <label class="auth-field">
                    <span>Email</span>
                    <input type="email" name="email" class="form-input" placeholder="admin@araro.games" required>
                </label>

                <label class="auth-field">
                    <span>Password</span>
                    <input type="password" name="password" class="form-input" placeholder="Enter password" required>
                </label>

                <button type="submit" class="btn btn-primary auth-button">
                    <i class="fas fa-right-to-bracket"></i>
                    <span>Login</span>
                </button>
            </form>

            <div class="auth-hint">
                Hidden page. Access it directly by URL.
            </div>
        </section>
    </main>

    <script src="../../assets/js/style.js"></script>
    <script src="js/login.js"></script>
</body>
</html>
