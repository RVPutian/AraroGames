/*
Appwrite Function template (Node.js) — Admin-protected delete for feedback rows

Usage:
- Deploy this as an Appwrite Function with runtime Node.js 18+.
- Set an environment variable named `APPWRITE_API_KEY` (Project API key) in the Function's settings.
- Ensure the Function has the `execute` permission as required.

Behavior:
- Receives JSON on stdin / HTTP body with: { action: 'delete', rowId: '<rowId>', token: '<session_jwt>' }
- Uses the provided `token` (user session JWT) to fetch the calling user's id via the Account service.
- Verifies the user is an admin by checking the `admins` table for a matching `userId` and active=true.
- If admin, uses the server API key to delete the feedback row from the `feedback` table.

IMPORTANT: After deploying, update your frontend `APPWRITE_ADMIN_CONFIG.deleteFunctionId` with the deployed function id.
*/

const Appwrite = require('node-appwrite');

const getStdin = async () => {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
};

(async () => {
  try {
    const raw = await getStdin();
    const payload = raw ? JSON.parse(raw) : {};

    const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
    const project = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT || '';
    const apiKey = process.env.APPWRITE_API_KEY;
    const adminsTableId = process.env.ADMINS_TABLE_ID || 'admins';
    const feedbackTableId = process.env.FEEDBACK_TABLE_ID || 'feedback';
    const databaseId = process.env.DATABASE_ID || '';

    if (!apiKey) {
      console.error('Missing APPWRITE_API_KEY environment variable');
      console.log(JSON.stringify({ error: 'Server misconfigured' }));
      process.exit(1);
    }

    const clientVerify = new Appwrite.Client()
      .setEndpoint(endpoint)
      .setProject(project);

    // Verify caller via session JWT
    if (!payload.token) {
      console.log(JSON.stringify({ error: 'Missing token' }));
      process.exit(1);
    }

    const clientWithJwt = clientVerify.clone();
    clientWithJwt.setJWT(payload.token);
    const account = new Appwrite.Account(clientWithJwt);

    let user;
    try {
      user = await account.get();
    } catch (err) {
      console.error('Failed to validate session JWT', err);
      console.log(JSON.stringify({ error: 'Invalid session' }));
      process.exit(1);
    }

    // Use API key client for privileged operations
    const serverClient = new Appwrite.Client()
      .setEndpoint(endpoint)
      .setProject(project)
      .setKey(apiKey);

    const tables = new Appwrite.Databases(serverClient);

    // Check admins table for this user
    const query = [`userId=${user.$id}`, 'active=true'];

    // Note: Node SDK query API differs by version. If your SDK uses TablesDB/listRows signature
    // update this call accordingly. Below is a generic REST-like attempt; adjust if needed.
    let isAdmin = false;
    try {
      const res = await tables.listDocuments(databaseId, adminsTableId, { limit: 1, filters: query });
      if (res && Array.isArray(res.documents) && res.documents.length > 0) {
        isAdmin = true;
      }
    } catch (err) {
      console.error('Failed to query admins table', err);
      console.log(JSON.stringify({ error: 'Server query failed' }));
      process.exit(1);
    }

    if (!isAdmin) {
      console.log(JSON.stringify({ error: 'Not authorized' }));
      process.exit(1);
    }

    if (payload.action === 'delete' && payload.rowId) {
      try {
        // Delete the document (feedback row)
        await tables.deleteDocument(databaseId, feedbackTableId, payload.rowId);
        console.log(JSON.stringify({ success: true }));
        process.exit(0);
      } catch (err) {
        console.error('Failed to delete row', err);
        console.log(JSON.stringify({ error: 'Delete failed' }));
        process.exit(1);
      }
    }

    console.log(JSON.stringify({ error: 'Invalid action or missing rowId' }));
    process.exit(1);
  } catch (err) {
    console.error('Function error', err);
    console.log(JSON.stringify({ error: 'Function crashed' }));
    process.exit(1);
  }
})();
