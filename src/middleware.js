/** Next.js 15 still loads middleware.js. Next 16 uses src/proxy.js instead. */
export { proxy as middleware, config } from './proxy';
