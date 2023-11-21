/ needs to be 100% tested!!

export class V3 {
  public readonly type = "V3"; // just to have a unique signature
  public constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number
  ) {}
}

export class P3 {
  public readonly type = "P3"; // just to have a unique signature
  public constructor(public readonly id: number, public readonly pos: V3) {}
}

export class L3 {
  public readonly type = "L3"; // just to have a unique signature
  public constructor(
    public readonly id: number,
    public readonly p1: P3,
    public readonly p2: P3
  ) {}
}

export class S3 {
  public readonly type = "S3"; // just to have a unique signature
  public constructor(
    public readonly id: number,
    public readonly lines: readonly L3[]
  ) {}
}

export class RoomModelGraph {
  // points
  private pointIdCounter = 0;
  private readonly pointMap = new Map<number, P3>();

  // lines
  private lineIdCounter = 0;
  private readonly linesMap = new Map<number, V3>();

  // surfaces
  private surfaceIdCounter = 0;
  private readonly surfaceMap = new Map<number, S3>();

  constructor(floorPoints: readonly V3[], heightInMeters: number) {}

  private addPoint(v: V3): number {
    const pointId = this.pointIdCounter++;
    const point = new P3(pointId, v);
    this.pointMap.set(pointId, point);
    return pointId;
  }

  private getPointById(id: number): P3 {
    const floorPoint = this.pointMap.get(id);
    if (floorPoint == null) {
      throw new Error(`No point with id ${id}`);
    }
    return floorPoint;
  }
}
