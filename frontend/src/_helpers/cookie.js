export function setCookie(name, value, inIFrame = false, expiryMinutes) {
  let expires = '';
  if (expiryMinutes) {
    const date = new Date();
    date.setTime(date.getTime() + expiryMinutes * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }

  if (inIFrame) {
    return (document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=None; Secure`);
  }

  document.cookie = `${name}=${value || ''}${expires}; path=/`;
}

export function getCookie(name) {
  let nameEQ = `${name}=`;
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return;
}

export function eraseCookie(name) {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
