
export default async function (reqBody) {

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log(`/utils/message-event.js receieved type: ${reqBody.type}`);

}