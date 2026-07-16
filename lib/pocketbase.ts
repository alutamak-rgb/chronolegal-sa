import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

let _pb: PocketBase | null = null;

export function getPb(): PocketBase {
  if (!_pb) {
    _pb = new PocketBase(PB_URL);
    _pb.autoCancellation(false);
  }
  return _pb;
}

export function getServerPb(): PocketBase {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  return pb;
}