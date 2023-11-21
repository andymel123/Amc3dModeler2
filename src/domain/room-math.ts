import { ShapeUtils, Vector2 } from "three";
import { V2 } from "./RoomModelGraph";

/** I place all room math related stuff that needs threejs in here, so it can be easy replaced if necessary
 * To use ThreeJS in my domain code is semi-optimal but porting all necessary math code seems not wise without a rela reason
 * At least I try to decouple threejs stuff from my other domain classes
 */

export function isClockWise(points: readonly V2[]): boolean {
  return ShapeUtils.isClockWise(points.map((v2) => new Vector2(v2.x, v2.y)));
}
