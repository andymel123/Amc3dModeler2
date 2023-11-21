import {
  Scene,
  Group,
  Color,
  Mesh,
  MeshNormalMaterial,
  PerspectiveCamera,
  WebGLRenderer,
  OrthographicCamera,
  BufferGeometry,
  BufferAttribute,
  MeshBasicMaterial,
  Fog,
  MeshStandardMaterial,
  BackSide,
  DoubleSide,
  FrontSide,
  AmbientLight,
  SpotLight,
  Vector3,
  Float32BufferAttribute,
  AxesHelper,
  Box3
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { ThreeJsRoom3dModel } from "./t3-Room3dModel";

// import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
// import { CSS2DRenderer, CSS2DObject } from '//cdn.rawgit.com/mrdoob/three.js/master/examples/jsm/renderers/CSS2DRenderer.js';
// import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';

class Main {
  /** The scene */
  private scene: Scene;

  /** The camera */
  private camera: PerspectiveCamera | OrthographicCamera;

  /** The renderer */
  private renderer: WebGLRenderer;

  /** The orbit controls */
  private controls: OrbitControls;

  /** The stats */
  private stats: Stats;
  private labelRenderer: CSS2DRenderer;

  /** The cube mesh */
  // public mesh: Mesh;
  private room3dRenderGroup: Group;
  private room3d: ThreeJsRoom3dModel;

  constructor() {
    this.initViewport();
  }

  /** Initialize the viewport */
  public initViewport() {
    // Init scene.
    this.scene = new Scene();
    this.scene.background = new Color(0xffffff);
    this.scene.fog = new Fog(0x050505, 2000, 3500);

    // Init camera.
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new PerspectiveCamera(27, aspect, 1, 3500);
    this.camera.up.set(0, 0, 1); // set the up vector to have the right behavior in the orbit controls!

    // this.camera.position.z = 30;
    this.camera.position.set(-6.6, -7.2, 9.3);

    // Init renderer.
    this.renderer = new WebGLRenderer({
      // powerPreference: "high-performance",
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.render(this.scene, this.camera);
    // this.renderer.setAnimationLoop(() => this.animate()); // uncomment if you want to use the animation loop
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener("resize", () => this.onResize());

    const axesHelper = new AxesHelper(5);
    this.scene.add(axesHelper);

    this.initLights();
    this.initializeLabelRenderer();

    // Init stats.
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    this.room3dRenderGroup = new Group();
    this.scene.add(this.room3dRenderGroup);

    // this will add all necessary meshes to visualize the room
    // and holds all room related logic
    this.room3d = new ThreeJsRoom3dModel(
      this.room3dRenderGroup,
      [
        new Vector3(0, 0, 0),
        new Vector3(4, 0, 0),
        new Vector3(4, 3, 0),
        new Vector3(0, 3, 0)
      ],
      3
    );

    // Init orbit controls (turn around center of model)
    const boundingBox = new Box3();
    boundingBox.setFromObject(this.room3dRenderGroup);
    const center = boundingBox.getCenter(new Vector3());
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(center.x, center.y, center.z);
    this.controls.update();
    this.controls.addEventListener("change", () => this.render());

    this.render();
  }

  private initLights() {
    const light = new AmbientLight(0xffffff);
    this.scene.add(light);

    const spotLight1 = new SpotLight(0xffffff);
    spotLight1.position.set(10, 10, 10);
    spotLight1.lookAt(new Vector3(0, 0, 0));
    this.scene.add(spotLight1);

    const spotLight2 = new SpotLight(0xffffff);
    spotLight2.position.set(-10, -10, -10);
    spotLight2.lookAt(new Vector3(0, 0, 0));
    this.scene.add(spotLight2);
  }

  private initializeLabelRenderer() {
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.domElement.style.position = "absolute";
    this.labelRenderer.domElement.style.top = "0px";
    this.labelRenderer.domElement.style.pointerEvents = "none"; // otherwise the pointer event does not reach the canvas/orbitControl
    document.body.appendChild(this.labelRenderer.domElement);
  }

  /** Renders the scene */
  public render() {
    if (this == null || this.stats == null) {
      console.warn("No render! this/stats == null!?");
      return;
    }
    this.stats.begin();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
  }

  /** Animates the scene */
  // public animate() {
  //   this.stats.begin();

  //   this.mesh.rotation.x += 0.005;
  //   this.mesh.rotation.y += 0.001;

  //   this.controls.update();
  //   this.renderer.render(this.scene, this.camera);

  //   this.stats.end();
  // }

  /** On resize event */
  public onResize() {
    try {
      if (this.camera instanceof PerspectiveCamera) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      }
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.render();
    } catch (err) {
      console.error("Error on resize!", err);
    }
  }
}

new Main();
