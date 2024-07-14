import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(req) {

    // Extract and log the URL parameters

    const params = (new URL(req.url)).searchParams;
    const base = (new URL(req.url)).origin;
    console.log(params);

    // Run  the handleParams funciton if we get both parameters

    if (params.get('app') && params.get('code')) {
        const response = await handleParams(base, params.get('app'), params.get('code'));
        if (response.status == 'success') {
            redirect(`/welcome?app=${params.get('app')}`);
        } else {
            return NextResponse.json({ error: "Error handling parameters.", status: 500 });
        }
    } else {
        return NextResponse.json({ error: "Need 2 parameters.", status: 400 });
    }

}

async function handleParams(base, app, code) {

    console.log(base);

    try {
        console.log(`Sending install parameters to events function`);
        const response = await fetch(`${base}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'InstallComplete', app, code }),
      });
  
      if (response.ok) {
        return {
            status: 'success',
        };
      } else {
        return {
            status: 'error',
        };
      }
    } catch (error) {
      console.error('Error:', error);
      return {
          status: 'error',
      };
    }

}