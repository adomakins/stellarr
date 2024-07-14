import { sql } from "@vercel/postgres";
import getAppInfo from "@app/api/utilities/apps/apps.js";

export default async function (app, code) {
  console.log(`/utils/install-complete.js receieved}`);

  app = await getAppInfo(app);
  // app now contains all info including app.secret and app.id

  let company;

  try {
    console.log(`Running installCompany(${app.alias}, ${code})`);
    company = await installCompany(app, code);
    // Get auth tokens using auth code
    // Get company info using auth tokens
    // Add company info to database
  } catch (error) {
    console.error(`Error in handleInstall: ${error.message}`);
    throw error;
  }

  // company should contain info about who installed it, use this to create user profile

  return { status: "success", id: company.id, email: company.email };
}

async function installCompany(app, code) {
  console.log("App Secret:", app.secret);

  let url;
  let options;
  let credentials;
  let company;

  // First API call to get auth tokens
  url = "https://services.leadconnectorhq.com/oauth/token";
  options = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: app.id,
      client_secret: app.secret,
      grant_type: "authorization_code",
      code: code,
      user_type: "Company",
    }),
  };

  try {
    const response = await fetch(url, options);
    credentials = await response.json();
    console.log(`Credentials obtained of type: ${credentials.userType}`);
  } catch (error) {
    console.error(error);
    throw error;
  }

  // Second API call to get company info
  url = `https://services.leadconnectorhq.com/companies/${credentials.companyId}`;
  options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${credentials.access_token}`,
      Version: "2021-07-28",
      Accept: "application/json",
    },
  };

  try {
    const response = await fetch(url, options);
    company = (await response.json()).company;
    console.log(`Company info obtained for: ${company.name}`);
  } catch (error) {
    console.error(error);
    throw error;
  }

  // Prepare installation object
  const installation = {
    [app.id]: {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      expires_at: Math.floor(
        (Date.now() + credentials.expires_in * 1000) / 1000,
      ), // Convert to seconds
      status: "installed",
    },
  };

  // Finally write company info to database
  try {
    await sql`
            INSERT INTO agencies (
                id, installations, name, logo, email, phone, website, info_json )
            VALUES (
                ${company.id},
                ${JSON.stringify(installation)}::jsonb,
                ${company.name},
                ${company.logoUrl},
                ${company.email},
                ${company.phone},
                ${company.website},
                ${JSON.stringify(company)}
            )
            ON CONFLICT (id) DO UPDATE SET
              installations = CASE
                WHEN agencies.installations ? ${app.id}
                THEN jsonb_set(
                  agencies.installations,
                  array[${app.id}],
                  ${JSON.stringify(installation[app.id])}::jsonb
                )
                ELSE agencies.installations || ${JSON.stringify(installation)}::jsonb
            END,
            name = EXCLUDED.name,
            logo = EXCLUDED.logo,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            website = EXCLUDED.website,
            info_json = EXCLUDED.info_json
    `;
    console.log("Agency record inserted or updated.");
  } catch (error) {
    console.error("Error inserting or updating agency:", error);
    throw error;
  }
  return { id: company.id, email: company.email };
}
