import {
  BufferGeometry,
  Group,
  Vector3,
  Vector2,
  DoubleSide,
  Mesh,
  Shape,
  ShapeGeometry,
  MeshStandardMaterial,
  BackSide,
  Side,
  FrontSide,
  ShapeUtils
} from "three";
import {
  checkArrayNoUndefinedElements,
  checkCoplanar,
  createPoly
} from "./t3-utils";

export class ThreeJsRoom3dModel {
  private pointIdCounter = 0;

  private readonly pointMap = new Map<number, Vector3>();
  private readonly faceMeshesMap = new Map<string, Mesh>();
  private readonly lineMeshesMap = new Map<string, Mesh>();

  constructor(
    private t3parentObject3D: Group,
    floorPoints: readonly Vector3[],
    heightInMeters: number
  ) {
    if (
      !ShapeUtils.isClockWise(floorPoints.map((v3) => new Vector2(v3.x, v3.y)))
    ) {
      /** if counter clockwise the normal vector looks up (positive z)
       * But I want all boundaries of the volume look out, so floor
       * needs to look down */
      floorPoints = floorPoints
        .slice() // a copy to not alter the array coming from outside
        .reverse();
    }

    // add all given floor points to the pointMap
    // Afterwards, I work with the point ids
    const floorPointIds: number[] = [];
    for (const v3 of floorPoints) {
      floorPointIds.push(
        // I copy the given points to be sure I can't mess with my
        // point instances from outside directly
        this.addPoint(v3.clone())
      );
    }

    // to be sure to not do anything with the original instances
    floorPoints = [];

    this.buildInitialMeshes(floorPointIds, heightInMeters);
  }

  private buildInitialMeshes(floorPointIds: number[], heightInMeters: number) {
    console.log("Create room meshes");

    // floor
    this.t3parentObject3D.add(
      this.createPoly("initialFloorMesh", floorPointIds, 0xaaaaaa)
    );

    // Reverse floor points for the rest
    // - for the ceiling the normal vector needs to look in
    //   the other direction as for the floor (so needs points reversed)
    // - for the walls: with the normal vector looking down
    //   for the floor, the points run to the left (counter clockwise
    //   from below). If the points run to the left on the bottom
    //   the points run clockwise on the walls from outside. I want
    //   the normal vectors to look outside, so they need to run
    //   counter cw from outside, so need reversed floorPoints as well.
    floorPointIds.reverse();

    // ceiling
    const ceilingPointIds: number[] = [];
    for (const fpId of floorPointIds) {
      const newPoint = this.getPointById(fpId).clone();
      newPoint.z = heightInMeters;
      // just a test
      // if (newPoint.y == 0) {
      //   newPoint.z = heightInMeters / 2;
      // }
      ceilingPointIds.push(this.addPoint(newPoint));
    }

    this.t3parentObject3D.add(
      this.createPoly("initialCeilingMesh", ceilingPointIds, 0xaaaaaa)
    );

    // walls
    for (let i = 0; i < floorPointIds.length; i++) {
      const idx1 = i;
      const idx2 = i + 1 < floorPointIds.length ? i + 1 : 0;

      // initially walls have 2 points on the floor and 2 on the ceiling
      const floorPoint1 = floorPointIds[idx1];
      const floorPoint2 = floorPointIds[idx2];
      const ceilPoint1 = ceilingPointIds[idx2]; // idx reverse to floorPoint as the points circle the poly
      const ceilPoint2 = ceilingPointIds[idx1]; // idx reverse to floorPoint as the points circle the poly

      this.t3parentObject3D.add(
        this.createPoly(
          `initial-wall-${idx1}-${idx2}`,
          [floorPoint1, floorPoint2, ceilPoint1, ceilPoint2],
          0xdddddd
        )
      );
    }
  }

  private addPoint(v: Vector3): number {
    const pointId = this.pointIdCounter++;
    this.pointMap.set(pointId, v);
    return pointId;
  }

  private getPointById(id: number): Vector3 {
    const floorPoint = this.pointMap.get(id);
    if (floorPoint == null) {
      throw new Error(`No point with id ${id}`);
    }
    return floorPoint;
  }

  private createPoly(
    name: string,
    pointIds: readonly number[],
    color: number,
    opacity = 1
  ) {
    checkArrayNoUndefinedElements(pointIds);

    // TODO build from graph
    // this.createLineMeshes(pointIds);

    // each poly gets an own material instance, to be able to change the color easily
    const matParams = {
      color,
      side: BackSide,
      opacity,
      transparent: opacity < 1
    };

    const mesh = createPoly(
      pointIds.map((pId) => this.getPointById(pId)),
      new MeshStandardMaterial(matParams)
    );

    mesh.name = name;
    this.faceMeshesMap.set(name, mesh);

    return mesh;
  }

  private createLineMeshes(pointIds: readonly number[]) {}
}
