/** @jsxImportSource react */
import { CameraUnavailableView, loadFamilyPhotoCapture } from '@/premium/flows/family';

/** Add family — photo enrollment for under-5 members. The premium camera
 *  screen (src/premium/flows/familyPhotoCapture, a 1:1 behaviour port of
 *  features/liveness/PhotoCapture) is lazy-required: it statically imports
 *  react-native-vision-camera, which throws on builds without NitroModules. */
const Photo = loadFamilyPhotoCapture();

export default function FamilyPhotoCaptureScreen() {
  return Photo ? <Photo /> : <CameraUnavailableView />;
}
