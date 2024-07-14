
import { sql } from '@vercel/postgres';

export async function GET() {

    console.log('Refreshing agency and location access tokens');

    const rate = 4; // Performs a refresh every 4 hours between 1pm and 1am UTC
    const margin = 30; // Safety margin of 30 minutes

    const threshold = new Date(Date.now() + (rate * 60 + margin) * 60 * 1000).toISOString();
    await refreshAgencies(threshold);
    await refreshLocations(threshold);

    return new Response('Token refresh process completed', { status: 200 });

}

async function refreshAgencies(threshold) {


    // Get a list of agencies to refresh
    const agencies = await sql`
        SELECT id, access, refresh
        FROM agencies
        WHERE
            config->>'installed' = 'true'
            AND expires <= ${threshold}
    `;

    console.log(`Found ${agencies.length} agencies to refresh`);

    for (const agency of agencies) {

        // Get new access and refresh tokens using fetch
        try {
            
            const url = 'https://services.leadconnectorhq.com/oauth/token';
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                body: new URLSearchParams({
                client_id: app,
                client_secret: process.env[`APP_SECRET_${name}`],
                grant_type: 'authorization_code',
                code: code,
                user_type: 'Company',
                })
            };


            const response = await fetch(url, options);
            credentials = await response.json();
            console.log(`Credentials obtained of type: ${credentials.userType}`);
            // Implement your token refresh logic here
            // Example:
            // const newTokens = await refreshTokenForAgency(agency.refresh);
            // await updateAgencyTokens(agency.id, newTokens);
            console.log(`Refreshed tokens for agency ${agency.id}`);
        } catch (error) {
            console.error(`Failed to refresh tokens for agency ${agency.id}:`, error);
        }
        // Write new access and refresh tokens to database
    }


}