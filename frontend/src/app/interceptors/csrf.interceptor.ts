import { HttpInterceptorFn } from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  // Helper function to read a cookie value by name
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
  };

  const csrfToken = getCookie('XSRF-TOKEN');

  // Clone the request to set withCredentials: true globally
  let clonedReq = req.clone({
    withCredentials: true
  });

  // Attach X-CSRF-Token header if the cookie exists
  if (csrfToken) {
    clonedReq = clonedReq.clone({
      headers: clonedReq.headers.set('X-CSRF-Token', csrfToken)
    });
  }

  return next(clonedReq);
};
