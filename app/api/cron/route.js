import { sql } from "@vercel/postgres";
import getAppInfo from "@/app/api/utilities/apps/apps.js";

export async function GET() {
  console.log("Refreshing agency and location access tokens");

  const interval = 5;
  // Checks for tokens expiring in the next (interval) hours

  const threshold = Math.floor(Date.now() / 1000) + interval * 60 * 60;

  await refreshTokens("agencies", threshold);
  await refreshTokens("locations", threshold);

  // await refreshLocations(threshold);
  // Not implemented yet

  return new Response("Token refresh process completed", { status: 200 });
}

async function refreshTokens(table, threshold) {
  // Get a list of records to refresh
  let query = `
      SELECT id, installations
      FROM "${table}"
      WHERE EXISTS (
          SELECT 1
          FROM jsonb_object_keys(installations) AS app
          WHERE (installations->app->>'expires_at')::bigint <= ${threshold}
      )
  `;

  const records = await sql.query(query);

  console.log(`Found ${records.rowCount} ${table} to refresh`);

  for (const record of records.rows) {
    const installations = record.installations;
    for (const [app, installation] of Object.entries(installations)) {
      if (installation.expires_at <= threshold) {
        const appInfo = await getAppInfo(app);
        try {
          const url = "https://services.leadconnectorhq.com/oauth/token";
          const options = {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: new URLSearchParams({
              client_id: app,
              client_secret: appInfo.secret,
              grant_type: "refresh_token",
              refresh_token: installation.refresh_token,
            }),
          };

          const response = await fetch(url, options);
          const newCredentials = await response.json();
          const newExpiration = Math.floor(
            (Date.now() + newCredentials.expires_in * 1000) / 1000,
          ); // Convert to seconds

          // Update the database with new tokens
          await sql`
                UPDATE ${table}
                SET installations = jsonb_set(
                  installations,
                  array[${app}],
                  jsonb_build_object(
                    'access_token', ${newCredentials.access_token},
                    'refresh_token', ${newCredentials.refresh_token},
                    'expires_at', ${newExpiration},
                    'status', 'installed'
                  )
                )
                WHERE id = ${record.id}
              `;

          console.log(
            `Refreshed tokens for record ${record.id}, app ${appInfo.alias}`,
          );
        } catch (error) {
          console.error(
            `Failed to refresh tokens for record in ${table} - ${record.id}, app ${appInfo.alias}:`,
            error,
          );
        }
      }
    }
  }
}
