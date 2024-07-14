
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

    // const projects = await (await fetch('assets/projects/projects.json')).json();

    let company;

    try {
        console.log(`Running installCompany(${name}, ${app}, ${code})`)
        company = await installCompany(name, app, code);
        // Get auth tokens using auth code
        // Get company info using auth tokens
        // Add company info to database
    } catch (error) {
        console.error(`Error in handleInstall: ${error.message}`);
        throw error;
    }

    // company should contain info about who installed it, use this to create user profile

    return { status: 'success', id: company.id, email: company.email };

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
    url = `https://services.leadconnectorhq.com/companies/${credentials.companyId}`;
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
        company = (await response.json()).company;
        console.log(`Company info obtained for: ${company.name}`);
    } catch (error) {
        console.error(error);
        throw error;
    }

    // Finally write company info to database
    try {
        await sql`
            INSERT INTO agencies (
                id, access, refresh, expires, config, name, logo, email, phone, website, info_json )
            VALUES (
                ${company.id},
                ${credentials.access_token},
                ${credentials.refresh_token},
                ${JSON.stringify({version: name, installed: true})},
                ${company.name},
                ${company.logoUrl},
                ${company.email},
                ${company.phone},
                ${company.website},
                ${JSON.stringify(company)}
            );
        `;
    } catch (error) {
        if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint "agencies_pkey"')) {
            console.log('This agency already exists in the database.');
            // Handle the duplicate key error here
            // For example, you might want to update the existing record instead of inserting a new one
            try {
                await sql`
                UPDATE agencies
                SET 
                    access = ${credentials.access_token},
                    refresh = ${credentials.refresh_token},
                    expires = ${new Date(Date.now() + credentials.expires_in * 1000).toISOString()},
                    config = ${JSON.stringify({version: name, installed: true})},
                    name = ${company.name},
                    logo = ${company.logo},
                    email = ${company.email},
                    phone = ${company.phone},
                    website = ${company.website},
                    info_json = ${JSON.stringify(company)}
                WHERE id = ${company.id};
                `;
                console.log('Existing agency record updated.');
            } catch (updateError) {
                console.error('Error updating existing agency:', updateError);
                throw updateError;
            }
        } else {
            console.error('Error inserting into database:', error);
            throw error;
        }
    }

    return ({ id: company.id, email: company.email });

}

