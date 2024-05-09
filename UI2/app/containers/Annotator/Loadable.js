/**
 *
 * Asynchronously loads the component for Annotator
 *
 */

import loadable from 'utils/loadable';

export default loadable(() => import('./index'));
