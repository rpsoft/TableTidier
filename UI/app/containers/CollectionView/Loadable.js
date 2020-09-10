/**
 *
 * Asynchronously loads the component for CollectionView
 *
 */

import loadable from 'utils/loadable';

export default loadable(() => import('./index'));
