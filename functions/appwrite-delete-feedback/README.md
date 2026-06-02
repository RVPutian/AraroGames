Appwrite Function: Admin-protected Feedback Delete

Overview

This Function is a template for an Appwrite Function (Node.js) that performs privileged deletes of feedback rows.
It verifies that the caller is an admin by validating a session JWT and checking the `admins` table. If authorized,
it deletes the specified row from the `feedback` table using a server API key.

Deployment steps

1. Create a new Function in your Appwrite Console:
   - Runtime: Node.js (18+ recommended)
   - Entry file: `index.js`
   - Upload the `index.js` content from this folder.

2. Set environment variables in the Function settings:
   - `APPWRITE_API_KEY`: Your Project API Key (server key) -- keep this secret
   - `APPWRITE_FUNCTION_ENDPOINT`: (optional) leave default or your Appwrite endpoint
   - `APPWRITE_FUNCTION_PROJECT_ID` or `APPWRITE_PROJECT_ID`: your project id
   - `DATABASE_ID`: your database id (e.g., `6a04949300345f370eff`)
   - `ADMINS_TABLE_ID`: `admins` (or your table id)
   - `FEEDBACK_TABLE_ID`: `feedback` (or your table id)

3. Deploy and note the Function ID.

4. In your frontend, set `APPWRITE_ADMIN_CONFIG.deleteFunctionId` to the deployed function id.

How the frontend should call it

POST to the Function executions endpoint:

Endpoint:
`POST https://<APPWRITE_ENDPOINT>/v1/functions/<FUNCTION_ID>/executions`

Headers:
- `Content-Type: application/json`
- `X-Appwrite-Project`: <PROJECT_ID>

Body: JSON containing `action`, `rowId`, and `token` (a session JWT created by `account.createJWT()` on the client):

{
  "action": "delete",
  "rowId": "<ROW_ID>",
  "token": "<SESSION_JWT_FROM_CLIENT>"
}

Security notes

- Do NOT put `APPWRITE_API_KEY` in client-side code. Set it only in function environment variables.
- After verifying the function works, tighten the `feedback` table DELETE permission to admins only.

Limitations & adjustments

- The Node SDK method names used in `index.js` may need adjustments depending on the `node-appwrite` SDK version. If you get errors on deployments, inspect the SDK version and adapt calls like `listDocuments` / `deleteDocument` to the correct method names (or directly call the HTTP API).

If you'd like, I can also:
- Attempt to detect the correct Node SDK methods and update `index.js` for your Appwrite version if you tell me the `node-appwrite` version available in your function runtime.
- Patch the frontend to show a nicer UI for delete confirmations and function errors.
