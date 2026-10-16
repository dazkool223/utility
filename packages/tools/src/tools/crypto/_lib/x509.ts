/** @peculiar/x509 needs the reflect-metadata polyfill (via tsyringe) loaded first. */
export async function loadX509() {
  await import('reflect-metadata');
  return import('@peculiar/x509');
}
