
export async function POST(req) {
  const body = await req.json();
  console.log(`New event received of type: ${body.type}`);

  const handlerPaths = {
    'OutboundMessage': 'message-event.js',
    'InboundMessage': 'message-event.js',
    'ContactCreate': 'contact-create.js',
    'OpportunityStatusUpdate': 'opportunity-status.js'
  };

  const handlerFile = handlerPaths[body.type];
  
  if (handlerFile) {
    await processEvent(handlerFile, body);
  } else {
    console.log(`No handler found for type: ${body.type}`);
  }

  return new Response("Processed", { status: 200 });
  
}

async function processEvent(handlerFile, reqBody) {

  console.log(`Calling dynamic function for type: ${reqBody.type}`);

  const module = await import(`@/utils/${handlerFile}`);

  await module.default(reqBody);

}
