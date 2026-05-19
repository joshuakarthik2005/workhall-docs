/**
 * SearchBar Override
 * 
 * This file "swizzles" the default Docusaurus SearchBar component.
 * By placing this file at src/theme/SearchBar/index.jsx, Docusaurus
 * will use our AISearch component instead of the default search bar.
 * 
 * This is the recommended way to replace the built-in search UI
 * without ejecting the entire theme.
 * 
 * See: https://docusaurus.io/docs/swizzling
 */

import React from 'react';
import AISearch from '@site/src/components/AISearch';

// Simply render our custom AISearch component in place of the default SearchBar
export default function SearchBar() {
  return <AISearch />;
}
