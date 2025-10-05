// Quick debug script to test session
// Run this in browser console on your app

async function debugSession() {

  
  // Check localStorage
  const localSession = localStorage.getItem('auth-session');

  
  // Check cookies

  
  // Test session endpoint
  try {
    const response = await fetch('/api/auth/session', { 
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const sessionData = await response.json();

  } catch (error) {

  }
  
  // Test organization endpoint directly
  try {
    const response = await fetch('/api/auth/organization/create', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Org',
        slug: 'test-org-' + Date.now()
      })
    });

    
    if (response.ok) {
      const data = await response.json();

    } else {
      const error = await response.text();

    }
  } catch (error) {

  }
}

debugSession();