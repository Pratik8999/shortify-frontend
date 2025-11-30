import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | Shortify` : 'Shortify - URL Shortener & Link Management';
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default usePageTitle;
