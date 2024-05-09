/**
 *
 * Asynchronously loads the component for SearchBar
 *
 */

import loadable from 'utils/loadable';

export default loadable(() => import('./index'));
