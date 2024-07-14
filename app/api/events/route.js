import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';

export async function POST(req) {

  const body = await req.json();
  console.log(`New event received of type: ${body.type}`);

  const handlerPaths = {
    'OutboundMessage': 'messages.js',
    'InboundMessage': 'messages.js',
    'ContactCreate': 'contacts.js',
    'OpportunityStatusUpdate': 'opportunities.js',
    // 'InstallComplete': 'installations.js', taken out, need to make the function parameters line up with the right use case
  };

  const handlerFile = handlerPaths[body.type];
  
  if (handlerFile) {
    waitUntil(processEvent(handlerFile, body));
  } else {
    console.log(`No handler found for type: ${body.type}`);
  }

  // Using waitUntil and not awaiting the processEvent function means we can return 200 OK immediately

  console.log(`Finished processing event of type: ${body.type}`);

  return NextResponse.json({ status: 200 });

}

async function processEvent(handlerFile, reqBody) {

  console.log(`Calling dynamic function for type: ${reqBody.type}`);

  const module = await import(`@/app/api/utils/handlers/${handlerFile}`);

  await module.default(reqBody);

  // Not rerturning anything here as we're using waitUntil and not awaiting this function

}
