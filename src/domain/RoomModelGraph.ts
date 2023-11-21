// needs to be 100% tested!!

import { isClockWise } from "./room-math";

export interface P3 {
  readonly type: "P3";
  readonly id: number;
  readonly pos: V3;
}
export interface L3 {
  readonly type: "L3";
  // readonly id: number;   I think Lines should be value Objects, they are totally defined by their points
  // Two lines with the same points should be the same line!
  readonly p1: P3;
  readonly p2: P3;
}
export interface S3 {
  readonly type: "S3";
  // readonly id: number;   I think surfaces should be value Objects, they are totally defined by their lines
  // Two surfaces with the same lines should be the same surface!
  readonly lines: readonly L3[];
}

export class V2 {
  public readonly type = "V2"; // just to have a unique signature
  public constructor(public readonly x: number, public readonly y: number) {}

  public clone(): V2 {
    return new V2(this.x, this.y);
  }
}

export class V3 {
  public readonly type = "V3"; // just to have a unique signature
  public constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number
  ) {}

  public clone(): V3 {
    return new V3(this.x, this.y, this.z);
  }
}

/**
 * The points are mutable ingternally to drag them around easily, without having to rebuild
 * the lines and surfaces that include them (but the exported interface is immutable)
 */
class P3Mutable implements P3 {
  public readonly type = "P3"; // just to have a unique signature

  // private lines = new Map<number, L3Mutable>(); have no ids anymore on the line
  private lines: L3Mutable[] = [];

  public constructor(
    public readonly id: number,
    public pos: V3 // mutable!!
  ) {}

  public addLine(l: L3Mutable): void {
    if (l.p1 != this && l.p2 != this) {
      throw new Error(
        `Can't add a line that does not contain this point! line: ${JSON.stringify(
          l
        )}, point: ${JSON.stringify(this)}`
      );
    }
    this.lines.push(l);
  }

  // not necessary yet, add it when I add the usecase
  // public removeLine(line: L3Mutable) {
  //   line.setInvalid();
  //   this.lines.splice(this.lines.indexOf(line), 1);
  // }
}

class L3Mutable implements L3 {
  public readonly type = "L3"; // just to have a unique signature
  private valid = true;
  public constructor(
    // public readonly id: number,
    public readonly p1: P3Mutable,
    public readonly p2: P3Mutable
  ) {}

  // not necessary yet, add it when I add the usecase
  // setInvalid() {
  //   // Just a way to find problems. I set this when I remove the line from a point
  //   this.valid = false;
  // }
  // isValid() {
  //   return this.valid;
  // }
}

export class S3Mutable implements S3 {
  public readonly type = "S3"; // just to have a unique signature
  public constructor(
    // public readonly id: number,
    public readonly lines: readonly L3Mutable[]
  ) {}
}

export class RoomModelGraph {
  // points
  private pointIdCounter = 0;
  private readonly pointMap = new Map<number, P3Mutable>();

  // lines
  // private lineIdCounter = 0;
  // private readonly lineMap = new Map<number, L3Mutable>();

  // surfaces
  // private surfaceIdCounter = 0;
  // private readonly surfaceMap = new Map<number, S3Mutable>();

  constructor(floorPoints: readonly V2[], heightInMeters: number) {
    // TO not use the array instance from outside (the points itself are immutable)
    const copyOfFloorPoints = floorPoints.slice();

    // just to be sure the copy is used instead of the original instance
    floorPoints = [];

    if (!isClockWise(floorPoints)) {
      /** if counter clockwise, the normal vector looks up (positive z)
       * But I want all boundaries of the volume look out, so floor
       * needs to look down */
      copyOfFloorPoints
        .slice() // a copy to not alter the array coming from outside
        .reverse();
    }

    this.buildInitialGraph(copyOfFloorPoints, heightInMeters);
  }

  private buildInitialGraph(floorPoints: V2[], heightInMeters: number) {
    // add all given floor points to the pointMap
    // Afterwards, I work with the point ids
    const floorP3s: P3Mutable[] = [];
    const floorLines: L3Mutable[] = [];
    let lastPoint: P3Mutable | null = null;
    for (const v2 of floorPoints) {
      const newPoint = this.addPoint(new V3(v2.x, v2.y, 0));
      floorP3s.push(newPoint);
      if (lastPoint != null) {
        // add a line between each two floor points
        const verticalLine = this.addLine(lastPoint, newPoint);
        floorLines.push(verticalLine);
      }
      lastPoint = newPoint;
    }
    if (lastPoint == null) {
      throw new Error(
        "No last Point after building floor points?! " + floorPoints
      );
    }
    // connect last with first point
    floorLines.push(this.addLine(lastPoint, floorP3s[0]));

    // floor surface
    this.addSurface(floorLines);

    // Reverse floor points for the rest
    // - for the ceiling the normal vector needs to look in
    //   the other direction as for the floor (so needs points reversed)
    // - for the walls: with the normal vector looking down
    //   for the floor, the points run to the left (counter clockwise
    //   from below). If the points run to the left on the bottom
    //   the points run clockwise on the walls from outside. I want
    //   the normal vectors to look outside, so they need to run
    //   counter cw from outside, so need reversed floorPoints as well.
    floorPoints.reverse();
    // floorPointIds.reverse();

    // ceiling
    // const ceilingPointIds: number[] = [];
    let firstCeilingPoint: P3 | null = null;
    let lastCeilingPoint = null;
    const ceilingLines: L3Mutable[] = [];
    for (const fp of floorP3s) {
      const ceilingPoint = this.addPoint(
        new V3(fp.pos.x, fp.pos.y, heightInMeters)
      );

      // add ceiling point
      // ceilingPointIds.push(ceilingPoint.id);
      if (lastCeilingPoint != null) {
        ceilingLines.push(this.addLine(lastCeilingPoint, ceilingPoint));
      } else {
        firstCeilingPoint = ceilingPoint;
      }

      // line between floor and ceiling points
      this.addLine(fp, ceilingPoint);

      lastCeilingPoint = ceilingPoint;
    }
    if (lastCeilingPoint == null || firstCeilingPoint == null) {
      throw new Error(
        `No first or last Point after building ceiling points?! first: ${firstCeilingPoint}, last: ${lastCeilingPoint}, floorPoints: ` +
          floorPoints
      );
    }
    // connect last with first point
    ceilingLines.push(this.addLine(lastPoint, firstCeilingPoint));
    this.addSurface(ceilingLines);

    // build walls
    // TODO
  }

  private addPoint(v: V3): P3Mutable {
    const pointId = this.pointIdCounter++;
    const point = new P3Mutable(pointId, v);
    this.pointMap.set(pointId, point);
    return point;
  }

  private getPointById(id: number): P3Mutable {
    const point = this.pointMap.get(id);
    if (point == null) {
      throw new Error(`No point with id ${id}`);
    }
    return point;
  }

  private addLine(p1: P3Mutable, p2: P3Mutable): L3Mutable {
    // const lineId = this.lineIdCounter++;
    const line = new L3Mutable(p1, p2);
    p1.addLine(line);
    p2.addLine(line);
    // this.lineMap.set(lineId, line);
    return line;
  }

  // private getLineById(id: number): L3Mutable {
  //   const line = this.lineMap.get(id);
  //   if (line == null) {
  //     throw new Error(`No line with id ${id}`);
  //   }
  //   return line;
  // }

  private addSurface(lines: readonly L3Mutable[]): S3Mutable {
    // const surfaceId = this.surfaceIdCounter++;
    const surface = new S3Mutable(lines);
    // this.surfaceMap.set(surfaceId, surface);
    return surface;
  }

  // private getSurfaceById(id: number): S3Mutable {
  //   const surface = this.surfaceMap.get(id);
  //   if (surface == null) {
  //     throw new Error(`No surface with id ${id}`);
  //   }
  //   return surface;
  // }
}
