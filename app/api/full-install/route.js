import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import handleInstall from '@/app/api/utilities/handlers/installations.js';

export async function GET(req) {

    // Extract and log the URL parameters

    const params = (new URL(req.url)).searchParams;
    const base = (new URL(req.url)).origin;
    console.log(params);

    // Run  the handleParams funciton if we get both parameters

    if (params.get('app') && params.get('code')) {
        const response = await handleInstall(params.get('app'), params.get('code'));
        if (response.status == 'success') {
            redirect(`/welcome?app=${params.get('app')}`);
        } else {
            return NextResponse.json({ error: "Error handling parameters.", status: 500 });
        }
    } else {
        return NextResponse.json({ error: "Need 2 parameters.", status: 400 });
    }

}