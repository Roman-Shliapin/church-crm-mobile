export const getFirstName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  return parts[0] || parts[1] || '';
};

export const getFullName = (fullName: string): string => fullName;
