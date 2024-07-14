
import { sql } from '@vercel/postgres';

export default async function (app, code) {

    console.log(`/utils/install-complete.js receieved}`);
    // await new Promise(resolve => setTimeout(resolve, 5000));

    const name = {
        'triggers_example_app': 'TRIGGERS',
        '6692fa1275f81cb8573d02dc-lykoo8lh': 'ENHANCEMENTS',
        'reporting_example_app': 'REPORTING',
        'advertising_example_app': 'ADVERTISING'
    }[app];

    let id;

    console.log(`name = ${name}`);

    try {
        console.log(`Running installCompany(${name}, ${app}, ${code})`)
        id = await installCompany(name, app, code);
        // Get auth tokens using auth code
        // Get company info using auth tokens
        // Add company info to database
    } catch (error) {
        console.error(`Error in handleInstall: ${error.message}`);
        throw error;
    }

}

async function installCompany(name, app, code) {

    console.log('App Secret:', process.env[`APP_SECRET_${name}`]);

    let url;
    let options;
    let credentials;
    let company;

    // First API call to get auth tokens
    url = 'https://services.leadconnectorhq.com/oauth/token';
    options = {
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

    try {
        const response = await fetch(url, options);
        credentials = await response.json();
        console.log(`Credentials obtained of type: ${credentials.userType}`);
    } catch (error) {
        console.error(error);
        throw error;
    }

    // Second API call to get company info
    url = 'https://services.leadconnectorhq.com/companies/ve9EPM428h8vShlRW1KT';
    options = {
        method: 'GET',
        headers: {
        Authorization: `Bearer ${credentials.access_token}`,
            Version: '2021-07-28',
            Accept: 'application/json'
        }
    };

    try {
        const response = await fetch(url, options);
        company = await response.json();
        console.log(`Company info obtained for: ${company.name}`);
    } catch (error) {
        console.error(error);
        throw error;
    }

    console.log(`company: ${JSON.stringify(company)}`);

    // Finally write company info to database
    try {
        await sql`
            INSERT INTO agencies (
                id, access, refresh, config, name, logo, email, phone, website, info_json )
            VALUES (
                ${company.id},
                ${credentials.access_token},
                ${credentials.refresh_token},
                ${JSON.stringify({version: name, installed: true})},
                ${company.name},
                ${company.logo},
                ${company.email},
                ${company.phone},
                ${company.website},
                ${JSON.stringify(company)}
            );
        `;
    } catch (error) {
        console.error(error);
        throw error;
    }

    return company.id;

}

