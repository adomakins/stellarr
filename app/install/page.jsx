 
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ConfirmationPage({ searchParams }) {

  const host = headers().get('host');
  console.log('Host:', host);
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  console.log('NODE ENV:', process.env.NODE_ENV);

  const { id, code } = searchParams;
  // id = app_id, code = auth_code
  

  let message = "If you're seeing this message... something ain't right";

  if (id && code) {
    try {
      console.log(`Sending install parameters id: ${id} and code: ${code} to events function`);
      const response = await fetch(`${protocol}://${host}/api/events`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'InstallComplete', id, code }),
      });
      if (response.ok) {
        message = "You're good to go.";
        redirect(`${protocol}://${host}/welcome/`);
      } else {
        message = "Error handling parameters.";
        console.log(message);
      }
    } catch (error) {
      if (error.digest?.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
      message = "Error sending parameters.";
      console.error('Error:', error);
    }
  } else {
      message = "Missing required parameters.";
      console.log(message);
  }

  return (
    <div>
      <h1>Installing...</h1>
    </div>
  );
}
