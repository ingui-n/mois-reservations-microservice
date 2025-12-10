/**
 * headers z API gateway jwt payload
 * @param headers
 * @returns {{userId: string, userEmail: string, userFirstname: string, userLastname: string, userRoles: array}}
 */
export const getAuthHeaders = headers => {
    const userId = headers.get('X-User-Id');
    const userEmail = headers.get('X-User-Email');
    const userFirstname = headers.get('X-User-Firstname');
    const userLastname = headers.get('X-User-Lastname');
    const userRoles = headers.get('X-User-Roles');

    return {
      userId,
      userEmail,
      userFirstname: decodeURI(userFirstname),
      userLastname: decodeURI(userLastname),
      userRoles: JSON.parse(userRoles) || []
    };
};
