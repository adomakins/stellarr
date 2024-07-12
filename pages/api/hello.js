
export default function helloWorld(req, res) {

    console.log(`New event received of type: ${req.body.type}`)

    res.status(200).json({ text: "Got it bro I'll take it from here" });
  
}