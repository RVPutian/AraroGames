document.addEventListener('DOMContentLoaded', () => {
    initializeClerkLogin();
});

async function initializeClerkLogin() {
    const authConfig = window.APP_AUTH || {};
    const mountNode = document.getElementById('clerkMount');

    if (!authConfig.isConfigured) {
        showAuthError('Clerk is not fully configured on the server.');
        return;
    }

    if (!mountNode) {
        showAuthError('Login container is missing.');
        return;
    }

    const clerkLoaded = await waitForClerk();
    if (!clerkLoaded) {
        showAuthError('Unable to load Clerk. Check your internet connection and try again.');
        return;
    }

    try {
        await window.Clerk.load({ publishableKey: authConfig.publishableKey });
    } catch (error) {
        showAuthError('Failed to initialize Clerk.');
        return;
    }

    let isCompletingSession = false;

    const completeSession = async () => {
        if (isCompletingSession) {
            return;
        }

        const sessionId = window.Clerk?.session?.id;
        if (!sessionId) {
            return;
        }

        isCompletingSession = true;
        const response = await fetch(authConfig.sessionEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                csrf_token: authConfig.csrfToken,
            }),
        });

        let data = { ok: false, message: 'Authentication failed.' };
        try {
            data = await response.json();
        } catch (error) {
            // Keep default fallback message.
        }

        if (response.ok && data.ok) {
            window.location.href = authConfig.redirectTo;
            return;
        }

        showAuthError(data.message || 'Authentication failed.');
        isCompletingSession = false;
    };

    if (window.Clerk.session?.id) {
        await completeSession();
        return;
    }

    window.Clerk.addListener(async ({ session }) => {
        if (session?.id) {
            await completeSession();
        }
    });

    window.Clerk.mountSignIn(mountNode, {});
}

function showAuthError(message) {
    const errorNode = document.getElementById('authError');
    if (!errorNode) {
        return;
    }

    errorNode.textContent = message;
    errorNode.style.display = 'block';
}

async function waitForClerk(maxWaitMs = 8000) {
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
        if (typeof window.Clerk !== 'undefined') {
            return true;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return false;
}
