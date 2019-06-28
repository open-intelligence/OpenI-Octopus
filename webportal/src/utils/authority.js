// use localStorage to store the authority info, which might be sent from server in actual project.
export function getAuthority() {
  // return localStorage.getItem('antd-pro-authority') || ['admin', 'User'];
  const authorityString = localStorage.getItem('authority');

  let authority;
  try {
    authority = JSON.parse(authorityString);
  } catch (e) {
    authority = null;
  }
  return authority;
}

export function setAuthority(authority) {
  return localStorage.setItem('authority', JSON.stringify(authority));
}
