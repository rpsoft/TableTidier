/**
 *
 * Asynchronously loads the component for FileUploader
 *
 */

import loadable from 'utils/loadable';

export default loadable(() => import('./index'));
