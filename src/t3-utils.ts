import {
  Vector2,
  Vector3,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  Material
} from "three";
import { ShapeUtils } from "three/src/extras/ShapeUtils";

/** points need to be in counter clockwise order around the poly, no crossings allowed */
export function createPoly(points: readonly Vector3[], material: Material) {
  if (points.length < 3) {
    throw Error(`Need at least 3 points to build poly`);
  }
  checkCoplanar(points);

  const vertices = points.flatMap((p) => [p.x, p.y, p.z]);
  console.log("createPoly from " + vertices);

  // all have the same normal vector
  const normalVect = getPlaneNormal(points);
  const normals = points.flatMap((p) => [
    normalVect.x,
    normalVect.y,
    normalVect.z
  ]);

  console.log("normal vect", normalVect);

  let projected2DPoints: Vector2[] | undefined = undefined;
  switch (maxDim(normalVect)) {
    case "x":
      projected2DPoints = points.map((p) => new Vector2(p.y, p.z));
      break;
    case "y":
      projected2DPoints = points.map((p) => new Vector2(p.x, p.z));
      break;
    case "z":
      projected2DPoints = points.map((p) => new Vector2(p.x, p.y));
      break;
  }

  if (projected2DPoints == null) {
    throw new Error(`Can't build poly?!`);
  }

  if (ShapeUtils.isClockWise(projected2DPoints)) {
    projected2DPoints.reverse();
  }

  // triangulation inspired by ShapeGeometry
  // faces = array of vertex indices like [ [ a,b,d ], [ b,c,d ] ]
  const faces = ShapeUtils.triangulateShape(
    projected2DPoints,
    [] // holes
  );

  // inspired by https://github.com/mrdoob/three.js/blob/master/src/geometries/ShapeGeometry.js#L116C4-L127C5
  const indices = [];
  for (let i = 0, l = faces.length; i < l; i++) {
    const face = faces[i];
    indices.push(face[0], face[1], face[2]);
  }

  const geometry = new BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));

  const mesh = new Mesh(geometry, material);
  return mesh;
}

// inspired by chatGPT
export function getPlaneNormal(points: readonly Vector3[]): Vector3 {
  if (points.length < 3) {
    throw new Error(
      `${points.length} points are not enough to calculate a plane normal!`
    );
  }

  // Vektoren, die zwei Kanten der Ebene repräsentieren
  const vector1 = new Vector3().copy(points[2]).sub(points[1]);
  const vector2 = new Vector3().copy(points[3]).sub(points[1]);

  // Kreuzprodukt der beiden Vektoren liefert den Normalvektor
  const normalVector = new Vector3().crossVectors(vector1, vector2);

  // Normalisiere den Vektor, um die Länge auf 1 zu bringen (Einheitsvektor)
  normalVector.normalize();

  return normalVector;
}

// inspired by https://stackoverflow.com/a/40929895/7869582
function tripleProduct(a: Vector3, b: Vector3, c: Vector3) {
  return a.clone().dot(b.clone().cross(c));
}

export function checkCoplanar(points: readonly Vector3[]) {
  // console.log("check", points);
  if (points.length < 3) {
    throw new Error(
      `${points.length} points are not enough to check coplanarity`
    );
  } else if (points.length == 3) {
    console.warn(`Not sane to check 3 points for coplanarity!`);
  }

  const a = points[0];
  const b = points[1];
  const c = points[2];

  const ab = b.clone().sub(a);
  const ac = c.clone().sub(a);

  for (let i = 3; i < points.length; i++) {
    const ad = points[i].clone().sub(a);
    if (tripleProduct(ab, ac, ad) !== 0) {
      throw Error(
        `Point with idx ${i} is not in the same plane as first 3 points in ${JSON.stringify(
          points
        )}`
      );
    }
  }
}

/**
 *  @param v a vector
 *  @returns 'x' if the x dimension is the largest absolute value, 'y' or 'z' if those are larges
 *    returns undefined if the length of the vector is 0. If multiple dimensions are equally the largest
 *    it returns one of them
 */
function maxDim(v: Vector3): "x" | "y" | "z" | undefined {
  let maxDim: "x" | "y" | "z" | undefined = undefined;
  let max: number = 0;

  const absX = Math.abs(v.x);
  const absY = Math.abs(v.y);
  const absZ = Math.abs(v.z);

  if (absX > max) {
    maxDim = "x";
    max = absX;
  }
  if (absY > max) {
    maxDim = "y";
    max = absY;
  }
  if (absZ > max) {
    maxDim = "z";
    max = absZ;
  }
  return maxDim;
}

export function checkArrayNoUndefinedElements(array: readonly any[]): void {
  if (array.includes(undefined)) {
    throw new Error(
      `array includes undefined elements!! ${JSON.stringify(array)}`
    );
  }
}
