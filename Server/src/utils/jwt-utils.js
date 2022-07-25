export function getJwtFromCookie(req) {
  // Get token from cookie
  const session = req.cookies.get('session')
  
  if (
    session &&
    session.split(' ')[0] === "Bearer"
  ) {
    return session.split(' ')[1];
  }

  return null;
}
