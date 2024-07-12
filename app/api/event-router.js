
export default function eventRouter(req, res) {


    console.log(`New event received of type: ${req.body.type}`)
  
    // Array that holds the different types of events we're expecting and the corresponding handler
    const handlerPaths = {
      'OutboundMessage': '../../utils/message-event',
      'InboundMessage': '../../utils/message-event',
      'ContactCreate': '../../utils/contact-create',
      'OpportunityStatusUpdate': '../../utils/opportunity-status'
    };
    
    const handlerPath = handlerPaths[req.body.type];
    
    handlerPath ? processEvent(handlerPath, req.body)
      : console.log(`No handler found for type: ${req.body.type}`);

    res.status(200).json({ text: "Got it bro I'll take it from here" });
  
  }
  
  // Function to import the module and call the default exported function
  
  async function processEvent(handlerPath, reqBody) {
  
    console.log(`Calling dynamic function for type: ${reqBody.type}`);
    const module = await import(handlerPath);
    module.default(reqBody);
  
  }